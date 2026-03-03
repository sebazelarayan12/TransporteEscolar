using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;

namespace TransporteEscolar.Application.Validation;

public static class GastoValidator
{
    private const int MinAnio = 2000;
    private const int MaxAnio = 2100;

    public static void ValidateGastoFijo(GastoModel.GastoFijoRequest dto)
    {
        ValidateMesAnio(dto.Mes, dto.Anio);
        ValidateMonto(dto.Monto);
        ValidateTexto(dto.Categoria, nameof(dto.Categoria), 120);
        ValidateTexto(dto.Descripcion, nameof(dto.Descripcion), 300);
        ValidateTexto(dto.MedioPago, nameof(dto.MedioPago), 80);
        ValidateObservaciones(dto.Observaciones);

        if (dto.DiaDeAplicacion is < 1 or > 31)
            throw new ValidationException("diaDeAplicacion debe estar entre 1 y 31");

        if (dto.PlanCuotas is not null)
            ValidatePlanCuotas(dto.PlanCuotas);
    }

    public static void ValidateUpdateGastoFijo(GastoModel.UpdateGastoFijoRequest dto)
    {
        ValidateMesAnio(dto.Mes, dto.Anio);
        ValidateMonto(dto.Monto);
        ValidateTexto(dto.Categoria, nameof(dto.Categoria), 120);
        ValidateTexto(dto.Descripcion, nameof(dto.Descripcion), 300);
        ValidateTexto(dto.MedioPago, nameof(dto.MedioPago), 80);
        ValidateObservaciones(dto.Observaciones);

        if (dto.DiaDeAplicacion is < 1 or > 31)
            throw new ValidationException("diaDeAplicacion debe estar entre 1 y 31");

        if (dto.PlanCuotas is not null)
            ValidatePlanCuotas(dto.PlanCuotas);
    }

    public static void ValidateGastoVariable(GastoModel.GastoVariableRequest dto)
    {
        ValidateMesAnio(dto.Mes, dto.Anio);
        ValidateMonto(dto.Monto);
        ValidateTexto(dto.Categoria, nameof(dto.Categoria), 120);
        ValidateTexto(dto.Descripcion, nameof(dto.Descripcion), 300);
        ValidateTexto(dto.MedioPago, nameof(dto.MedioPago), 80);
        ValidateObservaciones(dto.Observaciones);

        if (dto.Fecha.Year != dto.Anio || dto.Fecha.Month != dto.Mes)
            throw new ValidationException("La fecha del gasto debe pertenecer al mes seleccionado.");
    }

    public static void ValidateMesAnio(int mes, int anio)
    {
        if (mes is < 1 or > 12)
            throw new ValidationException("mes debe estar entre 1 y 12.");

        if (anio < MinAnio || anio > MaxAnio)
            throw new ValidationException($"anio debe estar entre {MinAnio} y {MaxAnio}.");
    }

    private static void ValidateMonto(decimal monto)
    {
        if (monto <= 0)
            throw new ValidationException("monto debe ser mayor a 0.");
    }

    private static void ValidateTexto(string valor, string nombreCampo, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(valor))
            throw new ValidationException($"{nombreCampo} es requerido.");

        if (valor.Length > maxLength)
            throw new ValidationException($"{nombreCampo} supera el máximo de {maxLength} caracteres.");
    }

    private static void ValidateObservaciones(string? observaciones)
    {
        if (observaciones is null)
            return;

        if (observaciones.Length > 500)
            throw new ValidationException("observaciones supera el máximo de 500 caracteres.");
    }

    private static void ValidatePlanCuotas(GastoModel.PlanCuotasRequest plan)
    {
        if (plan.CantidadCuotas <= 0)
        {
            throw new ValidationException("PlanCuotas.cantidadCuotas debe ser mayor a 0.");
        }

        if (plan.FechaPrimeraCuota.Year < MinAnio || plan.FechaPrimeraCuota.Year > MaxAnio)
        {
            throw new ValidationException("PlanCuotas.fechaPrimeraCuota está fuera de rango.");
        }
    }
}
