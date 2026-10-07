import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { loginFormSchema, type LoginFormValues } from '../schemas/login.schema';
import { useLogin } from '../services/auth.queries';
import { useSession } from '../hooks/useSession';
import { FormField } from '../../shared/ui/FormField';
import { Spinner } from '../../shared/ui/Spinner';
import { fieldAriaProps, fieldInputClass } from '../../shared/utils/form-field.helpers';
import type { ApiError } from '../../shared/types/api.types';

type LocationState = { from?: { pathname: string; search?: string; hash?: string } } | null;

// Bordes y fondo de los campos con contraste suficiente (WCAG 1.4.11) en claro y oscuro.
const campoClass = (hasError: boolean) =>
  `${fieldInputClass(hasError)} text-base dark:bg-[#18181b]! ${hasError ? '' : 'border-[#8a8f98]! dark:border-zinc-500!'}`;

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
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { usuario: '', password: '' },
  });

  // Foco inicial en el usuario (equivale a autoFocus, que react-doctor desaconseja).
  useEffect(() => {
    setFocus('usuario');
  }, [setFocus]);

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
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#fafafa] px-4 py-10 dark:bg-[#18181b]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(0,122,138,0.14),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.10),transparent_70%)]"
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#007a8a] to-cyan-400 text-white shadow-lg shadow-[#007a8a]/25">
            <span className="material-symbols-outlined text-[36px]" aria-hidden="true">
              directions_bus
            </span>
          </div>
          <p className="text-sm font-semibold text-[#00626e] dark:text-cyan-300">Transporte Escolar</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Bienvenido</h1>
          <p className="mt-2 max-w-[28ch] text-base text-gray-600 dark:text-gray-300">
            Ingresá con tu usuario y contraseña para continuar.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-5 rounded-2xl border border-[#e4e4e7] bg-white p-6 shadow-sm shadow-[#007a8a]/5 dark:border-[#3f3f46] dark:bg-[#27272a] sm:p-8"
        >
          <FormField id="usuario" label="Usuario" error={errors.usuario?.message}>
            <input
              id="usuario"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className={campoClass(Boolean(errors.usuario))}
              {...fieldAriaProps('usuario', errors.usuario?.message)}
              {...register('usuario')}
            />
          </FormField>

          <FormField id="password" label="Contraseña" error={errors.password?.message}>
            <div className="relative">
              <input
                id="password"
                type={mostrarPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={`${campoClass(Boolean(errors.password))} pr-12`}
                {...fieldAriaProps('password', errors.password?.message)}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setMostrarPassword((visible) => !visible)}
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={mostrarPassword}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-gray-600 transition-colors hover:text-[#007a8a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007a8a] dark:text-gray-300 dark:hover:text-cyan-300"
              >
                <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
                  {mostrarPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </FormField>

          {errorServidor && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                error
              </span>
              {errorServidor}
            </p>
          )}

          <button
            type="submit"
            disabled={login.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#007a8a] px-4 py-3 text-base font-semibold text-white transition hover:bg-[#00626e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007a8a] focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 dark:focus-visible:ring-offset-[#27272a]"
          >
            {login.isPending && <Spinner size="sm" className="border-white! border-t-transparent!" />}
            {login.isPending ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </main>
  );
};
