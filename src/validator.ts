import {arrayFormat} from './format';
import {validate} from 'class-validator';
import {plainToInstance} from 'class-transformer';
import type {ValidatorOptions} from 'class-validator';
import type {ClassConstructor, ClassTransformOptions} from 'class-transformer';

type ValidatorResult<T> = {
  data: T | null; // Transformed object or null if validation fails
  success: boolean; // Validation success status
  errors: string[] | null; // List of error messages or null if no errors
};

/**
 * Validates and transforms an input object into a class instance of type T, returning validation results.
 *
 * @template T - The class type to validate against.
 * @param {ClassConstructor<T>} cls - The class constructor to validate against.
 * @param {unknown} obj - The raw input data to validate and transform.
 * @param {ValidatorOptions} [validateOptions] - Optional validation settings.
 * @param {ClassTransformOptions} [transformOptions] - Optional transformation settings for converting plain objects to class instances.
 * @returns {Promise<ValidatorResult<T>>} - A promise that resolves to an object containing the transformed instance, validation success status, and error messages if any.
 *
 * @example
 * class User {
 *   //@IsString()
 *   name: string;
 * }
 *
 * const { data, success, errors } = await validator(User, { name: 123 });
 * console.log(success); // false
 * console.log(errors); // ["name must be a string"]
 */
export const classValidate = async <T>(
  cls: ClassConstructor<T>, // Class constructor to validate against
  obj: unknown, // Input data to validate and transform
  validateOptions?: ValidatorOptions, // Optional validation settings
  transformOptions?: ClassTransformOptions, // Optional transformation settings
): Promise<ValidatorResult<T>> => {
  // Merge custom options with defaults for validation
  validateOptions = {
    always: true, // Always run validation
    whitelist: true, // Strip properties not in the class
    forbidUnknownValues: false, // Allow unknown values by default
    ...validateOptions, // Override with user-defined options
  };

  // Merge custom options with defaults for transformation
  transformOptions = {
    enableImplicitConversion: true, // Allow implicit type conversion
    ...transformOptions, // Override with user-defined options
  };

  // Convert plain object to class instance
  const instance: T = plainToInstance(cls, obj, transformOptions);

  // Validate the instance using class-validator rules
  const validationErrors = await validate(
    instance as object, // Cast instance to object for validation
    validateOptions, // Pass validation options
  );

  // Determine if validation passed
  const isValid = validationErrors.length === 0;

  // Return validation result
  return {
    data: isValid ? instance : null, // Return instance if valid, otherwise null
    success: isValid, // Validation success status
    errors: isValid ? null : arrayFormat(validationErrors), // Format errors if validation failed
  };
};
