/* global process */

import { randomInt } from 'node:crypto'
import nodemailer from 'nodemailer'

const otpStore = new Map()

const toPositiveNumber = (value, fallbackValue) => {
  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallbackValue
}

const toBoolean = (value, fallbackValue = false) => {
  if (value === undefined || value === null || value === '') return fallbackValue
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase())
}

const createOtpError = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode })

const normalizeEmail = (value) => String(value ?? '').trim().toLowerCase()

const getOtpConfig = () => {
  const ttlMinutes = toPositiveNumber(process.env.AUTH_LOGIN_OTP_TTL_MINUTES, 10)
  const resendSeconds = toPositiveNumber(process.env.AUTH_LOGIN_OTP_RESEND_SECONDS, 60)
  const maxAttempts = Math.max(1, Math.floor(toPositiveNumber(process.env.AUTH_LOGIN_OTP_MAX_ATTEMPTS, 5)))
  const smtpPort = Math.max(1, Math.floor(toPositiveNumber(process.env.SMTP_PORT, 587)))
  const smtpUser = String(process.env.SMTP_USER ?? '').trim()

  return {
    ttlMinutes,
    ttlMs: ttlMinutes * 60 * 1000,
    resendSeconds,
    resendMs: resendSeconds * 1000,
    maxAttempts,
    smtpHost: String(process.env.SMTP_HOST ?? '').trim(),
    smtpPort,
    smtpSecure: toBoolean(process.env.SMTP_SECURE, smtpPort === 465),
    smtpUser,
    smtpPass: String(process.env.SMTP_PASS ?? '').trim(),
    from: String(process.env.OTP_EMAIL_FROM ?? smtpUser ?? '').trim(),
    subject: String(process.env.OTP_EMAIL_SUBJECT ?? 'Your Legasus login OTP').trim(),
  }
}

const isOtpEmailConfigured = () => {
  const config = getOtpConfig()
  return Boolean(config.smtpHost && config.smtpPort && config.from)
}

const isPreviewModeEnabled = () => String(process.env.NODE_ENV ?? '').trim().toLowerCase() !== 'production'

const cleanupExpiredOtps = () => {
  const currentTimestamp = Date.now()

  for (const [storeKey, entry] of otpStore.entries()) {
    if (entry.expiresAt <= currentTimestamp) {
      otpStore.delete(storeKey)
    }
  }
}

const generateOtpCode = () => String(randomInt(100000, 1000000))

const getStoreKey = (scope, email) => `${String(scope ?? 'login').trim().toLowerCase()}:${normalizeEmail(email)}`

const maskEmail = (email) => {
  const normalizedEmail = String(email ?? '').trim().toLowerCase()
  const [localPart, domain = ''] = normalizedEmail.split('@')

  if (!localPart || !domain) return normalizedEmail
  if (localPart.length <= 2) return `${localPart[0] ?? '*'}*@${domain}`

  return `${localPart.slice(0, 2)}${'*'.repeat(Math.max(1, localPart.length - 2))}@${domain}`
}

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const sendOtpEmail = async ({ email, firstName, code, ttlMinutes, subject, introText, plainTextPrefix }) => {
  const config = getOtpConfig()

  if (!isOtpEmailConfigured()) {
    if (isPreviewModeEnabled()) {
      return { previewCode: code }
    }

    throw createOtpError('Email OTP is not configured on the server yet. Please login with your password for now.', 503)
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: config.smtpUser || config.smtpPass
      ? {
          user: config.smtpUser,
          pass: config.smtpPass,
        }
      : undefined,
  })

  const customerName = String(firstName ?? '').trim() || 'there'
  const emailSubject = String(subject ?? config.subject).trim() || config.subject
  const bodyIntro = String(introText ?? 'Your login OTP for Legasus Store is:').trim()
  const textPrefix = String(plainTextPrefix ?? 'Your Legasus login OTP is').trim()
  const bodyText = `${textPrefix} ${code}. It expires in ${ttlMinutes} minutes.`
  const html = `
    <div style="font-family: Arial, sans-serif; color: #243353; line-height: 1.6;">
      <p>Hello ${escapeHtml(customerName)},</p>
      <p>${escapeHtml(bodyIntro)}</p>
      <p style="margin: 18px 0; font-size: 28px; font-weight: 700; letter-spacing: 0.28em;">${escapeHtml(code)}</p>
      <p>This OTP will expire in ${ttlMinutes} minutes.</p>
      <p>If you did not request this code, you can ignore this email.</p>
    </div>
  `

  await transporter.sendMail({
    from: config.from,
    to: email,
    subject: emailSubject,
    text: bodyText,
    html,
  })

  return { previewCode: '' }
}

const requestScopedOtp = async ({ email, user, scope = 'login', subject, introText, plainTextPrefix }) => {
  cleanupExpiredOtps()

  const normalizedEmail = normalizeEmail(email)
  const config = getOtpConfig()
  const currentTimestamp = Date.now()
  const storeKey = getStoreKey(scope, normalizedEmail)
  const existingEntry = otpStore.get(storeKey)

  if (existingEntry && existingEntry.resendAvailableAt > currentTimestamp) {
    const waitSeconds = Math.max(1, Math.ceil((existingEntry.resendAvailableAt - currentTimestamp) / 1000))
    throw createOtpError(`Please wait ${waitSeconds} seconds before requesting another OTP.`, 429)
  }

  const code = generateOtpCode()
  const nextEntry = {
    code,
    email: normalizedEmail,
    expiresAt: currentTimestamp + config.ttlMs,
    resendAvailableAt: currentTimestamp + config.resendMs,
    attemptsRemaining: config.maxAttempts,
  }

  otpStore.set(storeKey, nextEntry)

  try {
    const { previewCode } = await sendOtpEmail({
      email: normalizedEmail,
      firstName: user?.firstName,
      code,
      ttlMinutes: config.ttlMinutes,
      subject,
      introText,
      plainTextPrefix,
    })

    return {
      maskedEmail: maskEmail(normalizedEmail),
      expiresInSeconds: Math.ceil(config.ttlMs / 1000),
      resendAvailableInSeconds: Math.ceil(config.resendMs / 1000),
      previewCode,
    }
  } catch (error) {
    otpStore.delete(storeKey)
    throw error
  }
}

const verifyScopedOtp = async ({ email, otp, scope = 'login' }) => {
  cleanupExpiredOtps()

  const normalizedEmail = normalizeEmail(email)
  const normalizedOtp = String(otp ?? '').trim()
  const currentTimestamp = Date.now()
  const storeKey = getStoreKey(scope, normalizedEmail)
  const entry = otpStore.get(storeKey)

  if (!entry || entry.expiresAt <= currentTimestamp) {
    otpStore.delete(storeKey)
    throw createOtpError('This OTP has expired. Please request a new code.', 400)
  }

  if (entry.code !== normalizedOtp) {
    entry.attemptsRemaining -= 1

    if (entry.attemptsRemaining <= 0) {
      otpStore.delete(storeKey)
      throw createOtpError('Too many invalid OTP attempts. Please request a new code.', 429)
    }

    otpStore.set(storeKey, entry)
    throw createOtpError(`Invalid OTP. ${entry.attemptsRemaining} attempt(s) left.`, 401)
  }

  otpStore.delete(storeKey)
}

const requestLoginOtp = async ({ email, user }) =>
  requestScopedOtp({
    email,
    user,
    scope: 'login',
    subject: getOtpConfig().subject,
    introText: 'Your login OTP for Legasus Store is:',
    plainTextPrefix: 'Your Legasus login OTP is',
  })

const verifyLoginOtp = async ({ email, otp }) =>
  verifyScopedOtp({
    email,
    otp,
    scope: 'login',
  })

export {
  getOtpConfig,
  isOtpEmailConfigured,
  requestLoginOtp,
  requestScopedOtp,
  verifyLoginOtp,
  verifyScopedOtp,
}
