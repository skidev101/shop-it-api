export const SuccessRes = ({
  message,
  statusCode = 200,
}: {
  message: string;
  statusCode?: number;
}) => {
  return {
    success: true,
    message,
    statusCode,
  };
};
