import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { loginFormSchema, type LoginFormValues } from '../schemas/login.schema';
import { useLogin } from '../services/auth.queries';
import { useSession } from '../hooks/useSession';
import { FormField } from '../../shared/ui/FormField';
import { fieldAriaProps, fieldInputClass } from '../../shared/utils/form-field.helpers';
import type { ApiError } from '../../shared/types/api.types';

type LocationState = { from?: { pathname: string; search?: string; hash?: string } } | null;

const mensajeDeError = (error: unknown): string => {
  const apiError = error as Partial<ApiError> | null;
  if (apiError?.status === 401) return 'Usuario o contraseña incorrectos';
  if (apiError?.status === 503) return 'El servidor no tiene el acceso configurado';
  return apiError?.message ?? 'No se pudo iniciar sesión';
};

export const LoginPage = () => {
  const { autenticado } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { usuario: '', password: '' },
  });

  const from = (location.state as LocationState)?.from;
  const destino = from ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}` : '/';

  if (autenticado) {
    return <Navigate to={destino} replace />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    setErrorServidor(null);
    try {
      await login.mutateAsync({ usuario: values.usuario, password: values.password });
      navigate(destino, { replace: true });
    } catch (error) {
      setErrorServidor(mensajeDeError(error));
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafafa] px-4 dark:bg-[#18181b]">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="w-full max-w-sm space-y-5 rounded-2xl border border-[#e4e4e7] bg-white p-6 shadow-sm dark:border-[#3f3f46] dark:bg-[#27272a]"
      >
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Iniciar sesión</h1>

        <FormField id="usuario" label="Usuario" error={errors.usuario?.message}>
          <input
            id="usuario"
            type="text"
            autoComplete="username"
            className={fieldInputClass(Boolean(errors.usuario))}
            {...fieldAriaProps('usuario', errors.usuario?.message)}
            {...register('usuario')}
          />
        </FormField>

        <FormField id="password" label="Contraseña" error={errors.password?.message}>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className={fieldInputClass(Boolean(errors.password))}
            {...fieldAriaProps('password', errors.password?.message)}
            {...register('password')}
          />
        </FormField>

        {errorServidor && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {errorServidor}
          </p>
        )}

        <button
          type="submit"
          disabled={login.isPending}
          className="w-full rounded-lg bg-[#1d8ca5] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[#187286] focus:outline-none focus:ring-2 focus:ring-[#1d8ca5] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#83b8c5]"
        >
          {login.isPending ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </main>
  );
};
