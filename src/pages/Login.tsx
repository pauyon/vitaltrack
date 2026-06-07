import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Button, Link, Stack, TextField, Typography } from '@mui/material';
import AuthShell from '../components/AuthShell';
import { useAuth, authErrorMessage } from '../context/AuthContext';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const { signIn } = useAuth();
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
      await signIn(values.email, values.password);
      navigate('/', { replace: true });
    } catch (err) {
      setSubmitError(authErrorMessage(err));
    }
  });

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your health tracker">
      <form onSubmit={onSubmit} noValidate>
        <Stack spacing={2}>
          {submitError && <Alert severity="error">{submitError}</Alert>}
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
            autoComplete="current-password"
            fullWidth
            error={!!errors.password}
            helperText={errors.password?.message}
            {...register('password')}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            No account?{' '}
            <Link component={RouterLink} to="/signup" underline="hover">
              Create one
            </Link>
          </Typography>
        </Stack>
      </form>
    </AuthShell>
  );
}
