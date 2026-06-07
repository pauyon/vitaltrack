import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Button, Link, Stack, TextField, Typography } from '@mui/material';
import AuthShell from '../components/AuthShell';
import { useAuth, authErrorMessage } from '../context/AuthContext';

const schema = z
  .object({
    name: z.string().trim().min(1, 'Enter your name'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'At least 6 characters'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

type FormValues = z.infer<typeof schema>;

export default function SignUp() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError('');
    try {
      await signUp(values.email, values.password, values.name);
      navigate('/', { replace: true });
    } catch (err) {
      setSubmitError(authErrorMessage(err));
    }
  });

  return (
    <AuthShell title="Create your account" subtitle="Start tracking in seconds">
      <form onSubmit={onSubmit} noValidate>
        <Stack spacing={2}>
          {submitError && <Alert severity="error">{submitError}</Alert>}
          <TextField
            label="Name"
            autoComplete="name"
            fullWidth
            error={!!errors.name}
            helperText={errors.name?.message}
            {...register('name')}
          />
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            fullWidth
            error={!!errors.email}
            helperText={errors.email?.message}
            {...register('email')}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="new-password"
            fullWidth
            error={!!errors.password}
            helperText={errors.password?.message}
            {...register('password')}
          />
          <TextField
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            fullWidth
            error={!!errors.confirm}
            helperText={errors.confirm?.message}
            {...register('confirm')}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Already have an account?{' '}
            <Link component={RouterLink} to="/login" underline="hover">
              Sign in
            </Link>
          </Typography>
        </Stack>
      </form>
    </AuthShell>
  );
}
