# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Auth Flow >> logout works and redirects to login
- Location: e2e/auth.spec.ts:76:9

# Error details

```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
  navigated to "https://imedia.techbe.me/pt-BR/login"
  navigated to "https://imedia.techbe.me/pt-BR/login"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e8]: i
        - generic [ref=e9]: iMedia
      - generic [ref=e10]:
        - heading "Gerencie todas as suas redes sociais em um so lugar" [level=1] [ref=e11]
        - paragraph [ref=e12]: Conecte Instagram, YouTube, TikTok e X. Agende posts, acompanhe metricas e cresca sua audiencia com inteligencia.
      - generic [ref=e13]:
        - generic [ref=e14]: 2026 iMedia
        - generic [ref=e16]: Todos os direitos reservados
    - generic [ref=e19]:
      - generic [ref=e20]:
        - heading "Bem-vindo de volta" [level=1] [ref=e21]
        - paragraph [ref=e22]: Entre para gerenciar suas redes sociais
      - generic [ref=e23]:
        - generic [ref=e24]:
          - generic [ref=e25]: E-mail
          - generic [ref=e26]:
            - img
            - textbox "E-mail" [ref=e27]:
              - /placeholder: seu@email.com
        - generic [ref=e28]:
          - generic [ref=e29]:
            - generic [ref=e30]: Senha
            - link "Esqueceu a senha?" [ref=e31] [cursor=pointer]:
              - /url: /pt-BR/forgot-password
          - generic [ref=e32]:
            - img
            - textbox "Senha" [ref=e33]:
              - /placeholder: ••••••••
        - button "Entrar" [ref=e34] [cursor=pointer]:
          - text: Entrar
          - img
      - generic [ref=e35]:
        - separator [ref=e37]
        - generic [ref=e39]: ou continue com e-mail
      - button "Continuar com Google" [ref=e40] [cursor=pointer]:
        - img
        - text: Continuar com Google
      - paragraph [ref=e41]:
        - text: Nao tem conta?
        - link "Criar conta" [ref=e42] [cursor=pointer]:
          - /url: /pt-BR/register
  - region "Notifications alt+T"
  - alert [ref=e43]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | const TEST_EMAIL = "test@imedia.local";
  4  | const TEST_PASSWORD = "TestPassword123!";
  5  | 
  6  | test.describe("Auth Flow", () => {
  7  |     test.beforeEach(async ({ page }) => {
  8  |         // Clear all cookies and storage before each test
  9  |         await page.context().clearCookies();
  10 |     });
  11 | 
  12 |     test("login page loads without redirect loop", async ({ page }) => {
  13 |         const response = await page.goto("/pt-BR/login");
  14 |         expect(response?.status()).toBe(200);
  15 | 
  16 |         // Verify we are on the login page, not in a loop
  17 |         await expect(page.locator('input[type="email"]')).toBeVisible();
  18 |         await expect(page.locator('input[type="password"]')).toBeVisible();
  19 |         await expect(page.locator('button[type="submit"]')).toBeVisible();
  20 | 
  21 |         // Check URL did not change (no redirect loop)
  22 |         await expect(page).toHaveURL(/\/pt-BR\/login/);
  23 |     });
  24 | 
  25 |     test("login with valid credentials redirects to dashboard", async ({ page }) => {
  26 |         await page.goto("/pt-BR/login");
  27 | 
  28 |         // Fill login form
  29 |         await page.locator('input[type="email"]').fill(TEST_EMAIL);
  30 |         await page.locator('input[type="password"]').fill(TEST_PASSWORD);
  31 |         await page.locator('button[type="submit"]').click();
  32 | 
  33 |         // Wait for navigation to dashboard
  34 |         await page.waitForURL(/\/pt-BR\/dashboard/, { timeout: 10000 });
  35 | 
  36 |         // Verify dashboard loaded
  37 |         await expect(page.locator("text=Dashboard")).toBeVisible();
  38 |     });
  39 | 
  40 |     test("login with invalid credentials shows error", async ({ page }) => {
  41 |         await page.goto("/pt-BR/login");
  42 | 
  43 |         await page.locator('input[type="email"]').fill("wrong@example.com");
  44 |         await page.locator('input[type="password"]').fill("wrongpassword");
  45 |         await page.locator('button[type="submit"]').click();
  46 | 
  47 |         // Should stay on login page
  48 |         await expect(page).toHaveURL(/\/pt-BR\/login/);
  49 | 
  50 |         // Error toast should appear
  51 |         await expect(page.locator("[data-sonner-toast]")).toBeVisible({ timeout: 5000 });
  52 |     });
  53 | 
  54 |     test("dashboard redirects unauthenticated to login", async ({ page }) => {
  55 |         await page.goto("/pt-BR/dashboard");
  56 | 
  57 |         // Should redirect to login
  58 |         await page.waitForURL(/\/pt-BR\/login/, { timeout: 5000 });
  59 |         await expect(page).toHaveURL(/\/pt-BR\/login/);
  60 |     });
  61 | 
  62 |     test("root path redirects to login when unauthenticated", async ({ page }) => {
  63 |         await page.goto("/");
  64 | 
  65 |         // Root -> /pt-BR -> /pt-BR/dashboard -> /pt-BR/login
  66 |         await page.waitForURL(/\/pt-BR\/login/, { timeout: 5000 });
  67 |         await expect(page).toHaveURL(/\/pt-BR\/login/);
  68 |     });
  69 | 
  70 |     test("register page loads", async ({ page }) => {
  71 |         const response = await page.goto("/pt-BR/register");
  72 |         expect(response?.status()).toBe(200);
  73 |         await expect(page.locator('input[type="email"]')).toBeVisible();
  74 |     });
  75 | 
  76 |     test("logout works and redirects to login", async ({ page }) => {
  77 |         // First login
  78 |         await page.goto("/pt-BR/login");
  79 |         await page.locator('input[type="email"]').fill(TEST_EMAIL);
  80 |         await page.locator('input[type="password"]').fill(TEST_PASSWORD);
  81 |         await page.locator('button[type="submit"]').click();
> 82 |         await page.waitForURL(/\/pt-BR\/dashboard/, { timeout: 10000 });
     |                    ^ TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
  83 | 
  84 |         // Logout (assuming there's a logout button or we can call the API)
  85 |         await page.goto("/api/auth/sign-out");
  86 | 
  87 |         // Clear cookies to simulate logout
  88 |         await page.context().clearCookies();
  89 | 
  90 |         // Try to access dashboard
  91 |         await page.goto("/pt-BR/dashboard");
  92 |         await page.waitForURL(/\/pt-BR\/login/, { timeout: 5000 });
  93 |     });
  94 | });
  95 | 
```