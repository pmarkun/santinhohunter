{
  description = "Santinho Hunter Expo development shell";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { nixpkgs, ... }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forAllSystems (system:
        let
          pkgs = import nixpkgs { inherit system; };
          backendPackages = ps: [
            ps.fastapi
            ps.httpx
            ps.numpy
            ps.pillow
            ps.pytest
            ps.python-multipart
            ps.uvicorn
          ];
          backendPython = pkgs.python312.withPackages backendPackages;
          shellHook = ''
            export PYTHONPATH="$PWD/backend:$PYTHONPATH"
            export TF_FORCE_GPU_ALLOW_GROWTH="''${TF_FORCE_GPU_ALLOW_GROWTH:-true}"

            if [ -d /run/opengl-driver/lib ]; then
              export LD_LIBRARY_PATH="/run/opengl-driver/lib:''${LD_LIBRARY_PATH:-}"
            fi

            for nvidia_lib in "$PWD"/.venv*/lib/python*/site-packages/nvidia/*/lib; do
              if [ -d "$nvidia_lib" ]; then
                export LD_LIBRARY_PATH="$nvidia_lib:''${LD_LIBRARY_PATH:-}"
              fi
            done
          '';
        in
        {
          default = pkgs.mkShell {
            packages = [
              pkgs.nodejs_24
              pkgs.watchman
              pkgs.git
              backendPython
              pkgs.uv
            ];

            inherit shellHook;
          };
        });
    };
}
