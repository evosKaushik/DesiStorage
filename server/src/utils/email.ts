import resend from "../config/resend.js";

const sendEmail = async (
  receiverEmail: string,
  subject: string,
  html: string,
) => {
  const { data, error } = await resend.emails.send({
    from: "DesiStorage <support@kaushik.bond>",
    to: receiverEmail,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend failed: ${error.message}`);
  }

  return data;
};

export { sendEmail };
