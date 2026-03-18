using System.Collections.Generic;

namespace TransporteEscolar.Api.Configuration;

internal static class DotEnvLoader
{
    public static void Load(string? environmentName)
    {
        var envName = string.IsNullOrWhiteSpace(environmentName)
            ? "Production"
            : environmentName.Trim();

        var repoRoot = FindRepositoryRoot();
        var apiDirectory = DetermineApiDirectory(repoRoot);

        var candidateFiles = new List<string?>
        {
            repoRoot is null ? null : Path.Combine(repoRoot, ".env"),
            repoRoot is null ? null : Path.Combine(repoRoot, $".env.{envName}"),
            apiDirectory is null ? null : Path.Combine(apiDirectory, ".env"),
            apiDirectory is null ? null : Path.Combine(apiDirectory, $".env.{envName}")
        };

        var keysLoaded = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var filePath in candidateFiles)
        {
            if (string.IsNullOrWhiteSpace(filePath) || !File.Exists(filePath))
            {
                continue;
            }

            foreach (var entry in ParseFile(filePath))
            {
                var existingValue = Environment.GetEnvironmentVariable(entry.Key);
                var alreadySetBySystem = existingValue is not null && !keysLoaded.Contains(entry.Key);

                if (alreadySetBySystem)
                {
                    continue;
                }

                Environment.SetEnvironmentVariable(entry.Key, entry.Value);
                keysLoaded.Add(entry.Key);
            }
        }
    }

    private static IEnumerable<KeyValuePair<string, string>> ParseFile(string filePath)
    {
        foreach (var rawLine in File.ReadAllLines(filePath))
        {
            var line = rawLine.Trim();

            if (string.IsNullOrWhiteSpace(line) || line.StartsWith('#'))
            {
                continue;
            }

            var separatorIndex = line.IndexOf('=');
            if (separatorIndex <= 0)
            {
                continue;
            }

            var key = line[..separatorIndex].Trim();
            if (string.IsNullOrWhiteSpace(key))
            {
                continue;
            }

            var valuePortion = line[(separatorIndex + 1)..].Trim();

            if (valuePortion.Length >= 2 &&
                valuePortion.StartsWith('"') &&
                valuePortion.EndsWith('"'))
            {
                valuePortion = valuePortion[1..^1];
            }

            yield return new KeyValuePair<string, string>(key, valuePortion);
        }
    }

    private static string? FindRepositoryRoot()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);

        while (directory is not null)
        {
            var gitFolder = Path.Combine(directory.FullName, ".git");
            var solutionFile = Path.Combine(directory.FullName, "TransporteEscolar.sln");

            if (Directory.Exists(gitFolder) || File.Exists(solutionFile))
            {
                return directory.FullName;
            }

            directory = directory.Parent;
        }

        return null;
    }

    private static string? DetermineApiDirectory(string? repoRoot)
    {
        if (!string.IsNullOrWhiteSpace(repoRoot))
        {
            var apiPath = Path.Combine(repoRoot, "TransporteEscolar", "TransporteEscolar.Api");
            if (Directory.Exists(apiPath))
            {
                return apiPath;
            }
        }

        var currentDirectory = Directory.GetCurrentDirectory();
        return Directory.Exists(currentDirectory) ? currentDirectory : null;
    }
}
