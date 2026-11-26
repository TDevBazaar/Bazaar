import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt =
  "Deve — Desarrollo de Software y Soporte Técnico en Cuba";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  const logoBuffer = readFileSync(
    path.join(process.cwd(), "public", "brand", "logo.png")
  );
  const logoDataUri = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background:
            "radial-gradient(circle at 88% 12%, rgba(96, 24, 248, 0.16), transparent 45%), linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)",
          color: "#09090b",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoDataUri}
            alt="Deve"
            width={62}
            height={52}
            style={{ objectFit: "contain" }}
          />
          <span
            style={{
              marginLeft: "-4px",
              fontSize: "48px",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#5b21b6",
            }}
          >
            eve
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: "960px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "18px",
              fontWeight: 700,
              color: "#6018f8",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Cuba · Atención Remota Nacional y Taller en La Habana
          </div>
          <div
            style={{
              fontSize: "58px",
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              color: "#09090b",
            }}
          >
            Desarrollo de Software y Soporte Técnico en Cuba
          </div>
          <div
            style={{ fontSize: "25px", color: "#52525b", lineHeight: 1.35 }}
          >
            Software a Medida · Tiendas Online · Apps Android · Reparación y
            Mantenimiento de PCs y Celulares
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(9, 9, 11, 0.1)",
            paddingTop: "24px",
            fontSize: "22px",
            color: "#3f3f46",
          }}
        >
          <span>deve-blush.vercel.app · Consulta Gratis en 24h</span>
          <span style={{ color: "#5b21b6", fontWeight: 700 }}>
            WhatsApp +53 5252 9615
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
