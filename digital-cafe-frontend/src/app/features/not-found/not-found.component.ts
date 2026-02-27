import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { ButtonModule } from "primeng/button";

@Component({
  selector: "app-not-found",
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule],
  template: `
    <section class="not-found-wrap">
      <div class="not-found-card">
        <div class="icon-badge">
          <i class="pi pi-exclamation-triangle"></i>
        </div>
        <p class="code">404</p>
        <h1>Page Not Found</h1>
        <p class="desc">
          The page you are trying to open does not exist or was moved.
        </p>
        <div class="actions">
          <button pButton type="button" label="Go Home" icon="pi pi-home" routerLink="/"></button>
          <button
            pButton
            type="button"
            label="Login"
            icon="pi pi-sign-in"
            severity="secondary"
            routerLink="/auth/login"
          ></button>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .not-found-wrap {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 1rem;
        background: radial-gradient(circle at top right, #eff6ff 0%, #f8fafc 50%, #ecfeff 100%);
      }

      .not-found-card {
        width: min(100%, 540px);
        padding: 2rem;
        border-radius: 20px;
        text-align: center;
        border: 1px solid #dbe4f0;
        background: #ffffff;
        box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
      }

      .icon-badge {
        margin: 0 auto 0.8rem;
        width: 64px;
        height: 64px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, #2563eb, #4338ca);
        color: #ffffff;
        font-size: 1.6rem;
      }

      .code {
        margin: 0;
        color: #2563eb;
        font-weight: 700;
        letter-spacing: 0.08em;
      }

      h1 {
        margin: 0.4rem 0 0;
        color: #0f172a;
        font-size: clamp(1.6rem, 1.35rem + 1vw, 2.1rem);
      }

      .desc {
        margin: 0.8rem auto 0;
        color: #475569;
        max-width: 36ch;
      }

      .actions {
        margin-top: 1.3rem;
        display: flex;
        justify-content: center;
        gap: 0.65rem;
        flex-wrap: wrap;
      }

      @media (max-width: 520px) {
        .not-found-card {
          padding: 1.25rem;
          border-radius: 16px;
        }

        .actions {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class NotFoundComponent {}

