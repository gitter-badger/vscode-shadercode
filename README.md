# VS Code shader tools

Enable linting and tasking for shaders (GLSL, SPIR-V)

## Features

* Linting (experimental) 
* Problem matchers (`glsl` for `glslangValidator`) for compile task

## Planned 

* SPIR-V open and edit
* SPIR-V validation
* SPIR-V optimizer support 

## Requirements

* Installed `glslangValidator` in your system.
* Installed `vscode-shader` for identify shaders.

## Extension Settings

* `shadercode.enableLinter`: enable shader linter 
* `shadercode.lintArgTemplate`: set argument template of shader compiler (`$TARGET` for specify file)
* `shadercode.glslangValidatorPath`: path for `glslangValidator`

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

### 0.0.5

* Enable linter by default
* Default argument template

-----------------------------------------------------------------------------------------------------------

### For more information

* [glslang](https://github.com/KhronosGroup/glslang) 
