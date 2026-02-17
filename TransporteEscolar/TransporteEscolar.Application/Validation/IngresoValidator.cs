using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;

namespace TransporteEscolar.Application.Validation;

public static class IngresoValidator
{
    private const int MinAnio = 2000;
    private const int MaxAnio = 2100;

    public static void ValidateIngresoFijo(IngresoModel.IngresoFijoRequest dto)
    {
        ValidateMesAnio(dto.Mes, dto.Anio);
        ValidateMonto(dto.Monto);
        ValidateTexto(dto.Categoria, nameof(dto.Categoria), 120);
        ValidateTexto(dto.Descripcion, nameof(dto.Descripcion), 300);
        ValidateTexto(dto.MedioCobro, nameof(dto.MedioCobro), 80);
        ValidateObservaciones(dto.Observaciones);

        if (dto.DiaDeAplicacion is < 1 or > 31)
        {
            throw new ValidationException("diaDeAplicacion debe estar entre 1 y 31.");
        }
    }

    public static void ValidateIngresoVariable(IngresoModel.IngresoVariableRequest dto)
    {
        ValidateMesAnio(dto.Mes, dto.Anio);
        ValidateMonto(dto.Monto);
        ValidateTexto(dto.Categoria, nameof(dto.Categoria), 120);
        ValidateTexto(dto.Descripcion, nameof(dto.Descripcion), 300);
        ValidateTexto(dto.MedioCobro, nameof(dto.MedioCobro), 80);
        ValidateTexto(dto.EstadoCobro, nameof(dto.EstadoCobro), 60);
        ValidateObservaciones(dto.Observaciones);

        if (dto.Fecha.Year != dto.Anio || dto.Fecha.Month != dto.Mes)
        {
            throw new ValidationException("La fecha del ingreso debe pertenecer al mes seleccionado.");
        }
    }

    public static void ValidateMesAnio(int mes, int anio)
    {
        if (mes is < 1 or > 12)
        {
            throw new ValidationException("mes debe estar entre 1 y 12.");
        }

        if (anio < MinAnio || anio > MaxAnio)
        {
            throw new ValidationException($"anio debe estar entre {MinAnio} y {MaxAnio}.");
        }
    }

    private static void ValidateMonto(decimal monto)
    {
        if (monto <= 0)
        {
            throw new ValidationException("monto debe ser mayor a 0.");
        }
    }

    private static void ValidateTexto(string valor, string nombreCampo, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(valor))
        {
            throw new ValidationException($"{nombreCampo} es requerido.");
        }

        if (valor.Length > maxLength)
        {
            throw new ValidationException($"{nombreCampo} supera el máximo de {maxLength} caracteres.");
        }
    }

    private static void ValidateObservaciones(string? observaciones)
    {
        if (observaciones is null)
        {
            return;
        }

        if (observaciones.Length > 500)
        {
            throw new ValidationException("observaciones supera el máximo de 500 caracteres.");
        }
    }
}
