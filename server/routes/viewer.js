const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');

const router = express.Router();

// Helper: check top-secret access for a magic link
sync function checkTopSecretAccess(prototype, link) {
  if (!prototype.is_top_secret) return true;

  const accessRequest = await db('prototype_access_requests')
    .where('magic_link_id', link.id)
    .where('status', 'approved')
    .first();

  return !!accessRequest;
}