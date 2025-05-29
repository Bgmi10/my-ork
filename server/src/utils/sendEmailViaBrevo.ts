import axios from 'axios';

interface EmailPayload {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  sender?: {
    name: string;
    email: string;
  };
}

export const sendEmailViaBrevo = async (payload: EmailPayload): Promise<boolean> => {
  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        ...payload,
        sender: payload.sender || {
          name: 'MyOKR',
          email: 'subashchandraboseravi45@gmail.com',
        },
      },
      {
        headers: {
          'api-key': process.env.BREVO_SECRET,
          'content-type': 'application/json',
          'accept': 'application/json',
        },
      }
    );

    return response.status === 201;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}; 