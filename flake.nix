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
          backendFacePython = pkgs.python312.withPackages (ps:
            backendPackages ps ++ [
              ps.deepface
            ]);
          shellHook = ''
            export PYTHONPATH="$PWD/backend:$PYTHONPATH"
          '';
        in
        {
          default = pkgs.mkShell {
            packages = [
              pkgs.nodejs_24
              pkgs.watchman
              pkgs.git
              backendPython
            ];

            inherit shellHook;
          };

          face = pkgs.mkShell {
            packages = [
              pkgs.nodejs_24
              pkgs.watchman
              pkgs.git
              backendFacePython
            ];

            inherit shellHook;
          };
        });
    };
}
