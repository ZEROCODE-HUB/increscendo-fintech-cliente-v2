import { supabase } from './supabase';

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}

export const sendEmail = async (params: SendEmailParams): Promise<void> => {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: params,
    });
    if (error) {
      console.warn('[email] send failed', error.message);
    }
  } catch (err) {
    console.warn('[email] send error', err);
  }
};
