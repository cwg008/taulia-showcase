const db = require('../config/database');

async function sendSlackNotification(eventType, data) {
  try {
    // Read webhook URL from database
    const webhookSetting = await db('app_settings')
      .where('setting_key', 'slack_webhook_url')
      .first();

    // Silently return if no webhook URL is configured
    if (!webhookSetting || !webhookSetting.setting_value) {
      return;
    }

    const webhookUrl = webhookSetting.setting_value;

    // Check if specific events are enabled
    const eventsSetting = await db('app_settings')
      .where('setting_key', 'slack_events')
      .first();

    // If events are configured, check if this eventType is enabled
    if (eventsSetting && eventsSetting.setting_value) {
      let enabledEvents = [];
      try {
        enabledEvents = JSON.parse(eventsSetting.setting_value);
      } catch (e) {
        // If parsing fails, treat as empty array
        enabledEvents = [];
      }

      // If enabledEvents is explicitly configured and doesn't include this event, skip
      if (Array.isArray(enabledEvents) && enabledEvents.length > 0 && !enabledEvents.includes(eventType)) {
        return;
      }
    }

    // Format message based on event type
    let message = '';

    switch (eventType) {
      case 'view':
        message = `Prototype '${data.prototypeTitle}' was viewed via link '${data.linkLabel}'`;
        break;
      case 'feedback':
        message = `New ${data.rating}-star feedback on '${data.prototypeTitle}': '${data.message}' — ${data.email}`;
        break;
      case 'access_request':
        message = `Access requested for '${data.prototypeTitle}' by ${data.name} (${data.email})`;
        break;
      case 'access_approved':
        message = `Access approved for ${data.name} to '${data.prototypeTitle}'`;
        break;
      case 'access_denied':
        message = `Access denied for ${data.name} to '${data.prototypeTitle}'`;
        break;
      default:
        // Unknown event type, silently return
        return;
    }

    // Create Slack message payload
    const payload = {
      text: message,
      mrkdwn: true
    };

    // POST to webhook URL
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

  } catch (error) {
    // Log error but don't throw - this should never block the main application
    console.error('Error sending Slack notification:', error.message);
  }
}

module.exports = {
  sendSlackNotification
};
