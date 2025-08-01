/**
 * Capitalizes the first letter of each word in a name
 * @param name - The name to capitalize
 * @returns The name with first letter of each word capitalized
 */
export const capitalizeFirstLetters = (name: string): string => {
  if (!name || typeof name !== 'string') {
    return '';
  }
  
  return name
    .trim()
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

/**
 * Gets the first name from a full name and capitalizes it
 * @param fullName - The full name
 * @returns The capitalized first name
 */
export const getCapitalizedFirstName = (fullName: string): string => {
  if (!fullName || typeof fullName !== 'string') {
    return '';
  }
  
  const words = fullName.trim().split(' ');
  const firstName = words[0] || '';
  
  if (firstName.length === 0) return firstName;
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
};