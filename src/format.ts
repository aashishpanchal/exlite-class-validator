import type {ValidationError} from 'class-validator';

/**
 * Formats nested validation errors into a flat array of error messages.
 *
 * @param {ValidationError[]} errors - Array of validation errors to process.
 * @returns {string[]} - Flattened array of error messages.
 *
 * @example
 * const result = arrayFormat(errors);
 * console.log(result);
 * // Output: [
 * //   "email must be a valid email",
 * //   "password must be at least 8 characters"
 * // ]
 */
export const arrayFormat = (errors: ValidationError[]): string[] => {
  /**
   * Recursively maps nested errors to include the full path of each error.
   *
   * @param {ValidationError} err - The current error object.
   * @param {string} path - Accumulated path to the property.
   * @returns {ValidationError[]} - Flattened array of errors with full paths.
   */
  const mapErrors = (
    err: ValidationError,
    path: string = '',
  ): ValidationError[] => {
    // Return if no nested errors
    if (!err.children?.length) return [err];
    const nestedErrors = [];
    // Update path
    const newPath = path ? `${path}.${err.property}` : err.property;
    for (const child of err.children) {
      // Recursively handle deeper errors
      if (child.children?.length)
        nestedErrors.push(...mapErrors(child, newPath));
      // Add path to constraints
      nestedErrors.push(appendPathToConstraints(newPath, child));
    }
    return nestedErrors;
  };

  /**
   * Prepends path to each error message for context.
   *
   * @param {string} path - Path of the error property.
   * @param {ValidationError} err - Error with constraints to update.
   * @returns {ValidationError} - Updated error with full paths in constraints.
   */
  const appendPathToConstraints = (
    path: string,
    err: ValidationError,
  ): ValidationError => {
    const updatedConstraints: Record<string, string> = {};
    // Prepend path to each message
    for (const key in err.constraints)
      updatedConstraints[key] = `${path}.${err.constraints[key]}`;
    return {...err, constraints: updatedConstraints};
  };

  // Flatten errors, filter those with constraints, then extract all messages
  return errors
    .flatMap(err => mapErrors(err)) // Flatten all nested errors
    .filter(err => !!err.constraints) // Keep only errors with messages
    .map(err => Object.values(err.constraints)) // Extract messages
    .flat(); // Flatten to a single array of messages
};
