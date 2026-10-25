import { z } from 'zod';

type IssuePath = PropertyKey[];

const expectedTypeNames: Record<string, string> = {
  string: 'a string',
  number: 'a number',
  int: 'an integer number',
  boolean: 'a boolean value',
  array: 'an array',
  object: 'an object',
  date: 'a Date instance',
};

const formatNames: Record<string, string> = {
  email: 'an email',
  url: 'a URL address',
  jwt: 'a jwt string',
  date: 'a valid ISO 8601 date string',
  datetime: 'a valid ISO 8601 date string',
};

const describeInvalidType = (issue: z.core.$ZodRawIssue<z.core.$ZodIssueInvalidType>): string => {
  const isMissing = issue.input === undefined;

  if (isMissing) {
    return 'should not be empty';
  }

  const expectedType = expectedTypeNames[issue.expected] ?? issue.expected;

  return `must be ${expectedType}`;
};

const describeTooSmall = (issue: z.core.$ZodRawIssue<z.core.$ZodIssueTooSmall>): string | undefined => {
  const { origin, minimum } = issue;
  const isInclusive = issue.inclusive ?? true;
  const isNotEmptyCheck = Number(minimum) === 1;
  const isLengthCheck = origin === 'string' || origin === 'array';

  if (isLengthCheck && isNotEmptyCheck) {
    return 'should not be empty';
  }

  if (origin === 'string') {
    return `must be longer than or equal to ${minimum} characters`;
  }

  if (origin === 'array') {
    return `must contain at least ${minimum} elements`;
  }

  if (origin === 'number' && isInclusive) {
    return `must not be less than ${minimum}`;
  }

  if (origin === 'number') {
    return `must be greater than ${minimum}`;
  }

  return undefined;
};

const describeTooBig = (issue: z.core.$ZodRawIssue<z.core.$ZodIssueTooBig>): string | undefined => {
  const { origin, maximum } = issue;
  const isInclusive = issue.inclusive ?? true;

  if (origin === 'string') {
    return `must be shorter than or equal to ${maximum} characters`;
  }

  if (origin === 'array') {
    return `must contain no more than ${maximum} elements`;
  }

  if (origin === 'number' && isInclusive) {
    return `must not be greater than ${maximum}`;
  }

  if (origin === 'number') {
    return `must be less than ${maximum}`;
  }

  return undefined;
};

const describeInvalidFormat = (issue: z.core.$ZodRawIssue<z.core.$ZodIssueInvalidStringFormat>): string => {
  const formatName = formatNames[issue.format] ?? `a valid ${issue.format}`;

  return `must be ${formatName}`;
};

const describeUnrecognizedKeys = (keys: string[], path: IssuePath): string => {
  const messages = keys.map((key) => {
    const keyPath = [...path, key].join('.');

    return `property ${keyPath} should not exist`;
  });

  return messages.join(', ');
};

const describeInvalidUnion = (issue: z.core.$ZodRawIssue<z.core.$ZodIssueInvalidUnion>, path: IssuePath) => {
  const [firstBranchIssues = []] = issue.errors;
  const [branchIssue] = firstBranchIssues;

  if (!branchIssue) {
    return undefined;
  }

  const branchPath = [...path, ...branchIssue.path];
  const message = validationErrorMap({ ...branchIssue, path: branchPath } as z.core.$ZodRawIssue);

  return message ?? branchIssue.message;
};

const withField = (field: string, constraint: string | undefined): string | undefined => {
  if (!constraint) {
    return undefined;
  }

  return `${field} ${constraint}`;
};

export const validationErrorMap: z.core.$ZodErrorMap = (issue) => {
  const path = issue.path ?? [];
  const field = path.join('.') || 'value';

  switch (issue.code) {
    case 'invalid_type':
      return withField(field, describeInvalidType(issue));
    case 'too_small':
      return withField(field, describeTooSmall(issue));
    case 'too_big':
      return withField(field, describeTooBig(issue));
    case 'invalid_format':
      return withField(field, describeInvalidFormat(issue));
    case 'invalid_value':
      return withField(field, `must be one of the following values: ${issue.values.join(', ')}`);
    case 'custom':
      return withField(field, issue.params?.constraint);
    case 'unrecognized_keys':
      return describeUnrecognizedKeys(issue.keys, path);
    case 'invalid_union':
      return describeInvalidUnion(issue, path);
  }
};
