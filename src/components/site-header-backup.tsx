import * as React from "react";
import Image from "next/image";

// Ganti URL asset di bawah ini jika sudah diupload ke public/
const imgLogotisnn1 = "/assets/685d2f624234e22d34622408df75096b24846b0f.png";
const imgLogo = "/assets/454b30b5a371daaf5fcc0913a925fc08c9b5aa8a.svg";
const imgRectangle8 = "/assets/47507cd267bb9e1c44760de4da2a9922fed87174.svg";

function Logo({ className }: { className?: string }) {
  return (
    <div className={className} style={{ position: "relative" }}>
      <Image alt="Logo" className="block" src={imgLogo} width={96} height={96} />
      <div style={{ position: "absolute", left: "21%", right: "8%", top: 37, width: 78, height: 78, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ transform: "rotate(345.36deg)", width: 78, height: 78 }}>
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <Image alt="Logo Inner" src={imgLogotisnn1} fill style={{ objectFit: "cover" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SiteHeaderBackup() {
  return (
    <header style={{ position: "relative", background: "#fff", width: "100%", height: 93, borderRadius: 20, overflow: "hidden" }}>
      {/* Background bar */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 10, background: "#48a154", boxShadow: "0px 4px 4px 0px rgba(0,0,0,0.25)" }} />
      {/* Rectangle accent */}
      <div style={{ position: "absolute", left: "50%", top: 79, transform: "translateX(-50%)", width: 1393, height: 14 }}>
        <Image src={imgRectangle8} alt="Accent" width={1393} height={14} style={{ width: "100%", height: "100%" }} />
      </div>
      {/* Logo */}
      <div style={{ position: "absolute", left: -8, top: -42, width: 135, height: 135 }}>
        <Logo />
      </div>
      {/* Judul */}
      <h1 style={{ position: "absolute", left: "50%", top: 14, transform: "translateX(-50%)", color: "#4dab58", fontWeight: 700, fontSize: 48, fontFamily: 'Inter, sans-serif', letterSpacing: 0 }}>DASHBOARD FTTH</h1>
      {/* Tombol kanan (dummy) */}
      <button style={{ position: "absolute", right: 16, top: 17, width: 59, height: 59, background: "#fff", borderRadius: 20, border: "none", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        {/* Placeholder icon/button, bisa diganti sesuai kebutuhan */}
        <span style={{ display: "block", width: 30, height: 30, background: "#4dab58", borderRadius: 5, margin: "auto" }} />
      </button>
    </header>
  );
}
