export const SuccessRes = ({
  message,
  statusCode = 200,
  data = {}
}: {
  message: string;
  data?: any;
  statusCode?: number;
}) => {
  return {
    success: true,
    message,
    data,
    statusCode,
  };
};
