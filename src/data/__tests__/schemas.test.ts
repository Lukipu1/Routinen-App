import { makeCompletion, makeExecution, makeRoutine } from '../../testing/factories';
import { completionSchema, executionSchema, routineSchema } from '../schemas';

describe('zod schemas', () => {
  it('accepts a well-formed routine', () => {
    expect(routineSchema.safeParse(makeRoutine()).success).toBe(true);
  });

  it('rejects a routine without a title', () => {
    const result = routineSchema.safeParse(makeRoutine({ title: '' }));
    expect(result.success).toBe(false);
  });

  it('rejects a routine with no steps', () => {
    const result = routineSchema.safeParse(makeRoutine({ steps: [] }));
    expect(result.success).toBe(false);
  });

  it('validates executions and completions', () => {
    expect(executionSchema.safeParse(makeExecution()).success).toBe(true);
    expect(completionSchema.safeParse(makeCompletion()).success).toBe(true);
  });

  it('rejects an invalid execution status', () => {
    const result = executionSchema.safeParse(makeExecution({ status: 'weird' as never }));
    expect(result.success).toBe(false);
  });
});
