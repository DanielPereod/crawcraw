import path from 'path';

export async function loadConfig(configPath: string) {
  try {
    const isAbsolutePath = path.isAbsolute(configPath);
    const absolutePath = isAbsolutePath
      ? configPath
      : path.resolve(__dirname, '../', configPath);
    const configModule = await import(absolutePath);

    return configModule.default;
  } catch (error) {
    throw new Error(`Error loading configuration: ${error}`);
  }
}
