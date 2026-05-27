export const getErrorMessage = async (
  response: Response,
  fallback: string
) => {
  const errorText = await response.text();

  try {
    const errorData = JSON.parse(errorText);
    return errorData.error || fallback;
  } catch {
    return errorText || fallback;
  }
};