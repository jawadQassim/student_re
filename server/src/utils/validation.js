import { createHttpError } from '../middleware/errorHandler.js';
import { VALID_DAYS, VALID_ROLES } from './constants.js';

export function normalizeText(value, fieldName) {
  const normalized = typeof value === 'string' ? value.trim() : '';

  if (!normalized) {
    throw createHttpError(400, `${fieldName} is required.`);
  }

  return normalized;
}

export function normalizeOptionalText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeRole(value) {
  const role = normalizeText(value, 'Role');

  if (!VALID_ROLES.has(role)) {
    throw createHttpError(400, 'Role must be Admin, Teacher, or Student.');
  }

  return role;
}

export function normalizeDay(value) {
  const day = normalizeText(value, 'Day');

  if (!VALID_DAYS.has(day)) {
    throw createHttpError(400, 'Day must be a valid weekday.');
  }

  return day;
}

export function normalizeEmail(value) {
  return normalizeText(value, 'Email').toLowerCase();
}

export function normalizeDateOnly(value, fieldName) {
  const dateValue = normalizeText(value, fieldName);
  const parsedDate = new Date(`${dateValue}T00:00:00.000Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw createHttpError(400, `${fieldName} must be a valid YYYY-MM-DD date.`);
  }

  return parsedDate;
}
