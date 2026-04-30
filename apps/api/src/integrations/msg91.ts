import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

const MSG91_API_URL = 'https://control.msg91.com/api/v5/flow';

export async function sendSMS(phone: string, message: string): Promise<void> {
  try {
    const response = await axios.post(MSG91_API_URL, {
      authkey: config.msg91.authKey,
      template_id: config.msg91.templateId,
      sender: config.msg91.senderId,
      mobiles: phone,
      VAR1: message,
    });

    if (response.data.type !== 'success') {
      throw new Error(`MSG91 error: ${response.data.message}`);
    }

    logger.info(`SMS sent to ${phone}`);
  } catch (error) {
    logger.error('MSG91 SMS failed:', error);
    throw new Error('Failed to send SMS');
  }
}
