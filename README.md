# codemie-capstone

## Local deployment (Windows / PowerShell)

1) Open **PowerShell**.

2) Run these commands:

```powershell
cd C:\repos\capstone\codemie-capstone\codemie-capstone
.\scripts\deploy-local.ps1
```

3) Verify the app is responding:

```powershell
ping https://localhost:3000
```

## Troubleshooting

### `.\scripts\deploy-local.ps1` not found / missing
- Confirm you are in the correct folder:

```powershell
cd C:\repos\capstone\codemie-capstone\codemie-capstone
```

- Check the script exists:

```powershell
Test-Path .\scripts\deploy-local.ps1
```

If it returns `False`, ensure the repository was fully cloned (including the `scripts` folder) and you are pointing to the correct `codemie-capstone` directory.