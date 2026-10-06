type DoctorAuthIllustrationProps = {
  mode: "register" | "login";
};

export function DoctorAuthIllustration({ mode }: DoctorAuthIllustrationProps) {
  return (
    <svg
      className={`doctor-auth-illustration doctor-auth-illustration-${mode}`}
      viewBox="0 0 520 520"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="auth-glow" cx=".5" cy=".45" r=".5">
          <stop stopColor="#DDF2FC" />
          <stop offset="1" stopColor="#DDF2FC" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="auth-heart" x1="167" y1="170" x2="353" y2="366" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F8A395" />
          <stop offset=".52" stopColor="#E77479" />
          <stop offset="1" stopColor="#B84662" />
        </linearGradient>
        <linearGradient id="auth-heart-vessel" x1="230" y1="107" x2="299" y2="215" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F4B3A1" />
          <stop offset="1" stopColor="#CA6470" />
        </linearGradient>
        <linearGradient id="auth-lung" x1="178" y1="214" x2="254" y2="354" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F8C8BE" />
          <stop offset=".55" stopColor="#E99796" />
          <stop offset="1" stopColor="#D27784" />
        </linearGradient>
        <linearGradient id="auth-lung-right" x1="264" y1="217" x2="341" y2="355" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F2B2AA" />
          <stop offset=".6" stopColor="#DA858A" />
          <stop offset="1" stopColor="#C66B7A" />
        </linearGradient>
        <filter id="auth-shadow" x="60" y="65" width="400" height="400" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#5682A0" floodOpacity=".15" />
        </filter>
      </defs>

      <circle cx="260" cy="257" r="222" fill="url(#auth-glow)" />
      <circle cx="260" cy="257" r="178" stroke="#A9D5EA" strokeOpacity=".45" />
      <circle cx="260" cy="257" r="202" stroke="#A9D5EA" strokeOpacity=".28" strokeDasharray="2 9" />
      <circle cx="103" cy="180" r="3" fill="#73B3D3" />
      <circle cx="406" cy="324" r="3" fill="#73B3D3" />
      <circle cx="358" cy="104" r="2" fill="#73B3D3" />
      <g filter="url(#auth-shadow)">
        {mode === "register" ? (
          <>
            <path d="M239 207c-8-24-7-51-5-82 2-22 16-31 30-30 16 1 21 16 18 34l-7 50m-9-43c4-22 18-38 33-34 15 4 15 18 8 39l-17 48" stroke="#B54F65" strokeWidth="24" strokeLinecap="round" />
            <path d="M239 207c-8-24-7-51-5-82 2-22 16-31 30-30 16 1 21 16 18 34l-7 50m-9-43c4-22 18-38 33-34 15 4 15 18 8 39l-17 48" stroke="url(#auth-heart-vessel)" strokeWidth="15" strokeLinecap="round" />
            <path d="M260 206c-26-38-94-23-98 34-6 77 79 121 124 159 10 8 23 6 29-5 23-42 74-86 78-141 4-54-56-79-96-47-11 9-17 17-21 24-4-9-9-17-16-24Z" fill="url(#auth-heart)" stroke="#FFF0E9" strokeWidth="4" />
            <path d="M206 246c17-10 32-7 43 7l13 17 20-29c11-16 35-18 50-5m-109 72c19 4 35-1 47-16l13-17 19 22c10 11 23 16 40 13" stroke="#FFE5DB" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" opacity=".68" />
            <path d="M259 265c5 11 9 22 12 37" stroke="#FFF0E9" strokeWidth="4" strokeLinecap="round" opacity=".72" />
          </>
        ) : (
          <>
            <path d="M251 151v111m18-111v111m-18-70-33 34m33-7-35 44m53-71 35 34m-35-7 37 44" stroke="#C9757D" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M245 207c-9-19-15-39-23-55-11-21-31-28-51-18-23 11-37 44-43 79-9 47-7 103 14 131 16 22 42 24 63 12 27-16 43-56 48-96m22-53c9-19 15-39 23-55 11-21 31-28 51-18 23 11 37 44 43 79 9 47 7 103-14 131-16 22-42 24-63 12-27-16-43-56-48-96" fill="url(#auth-lung)" stroke="#FFF3ED" strokeWidth="4" />
            <path d="M269 208c-7-18-13-36-21-50-11-19-28-26-47-18-22 10-36 42-42 75-7 42-5 91 13 115 14 19 35 21 53 11 23-13 37-47 44-82m-23-15-39-27m41 52-42-10m123-15 39-27m-41 52 42-10" stroke="#FFF0E9" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity=".75" />
            <path d="M260 263v91c0 14-8 22-8 37m8-128c10 9 16 21 21 34" stroke="#C9757D" strokeWidth="12" strokeLinecap="round" />
          </>
        )}
      </g>
      <path d={mode === "register" ? "M130 361h59l18-16 18 16h36" : "M126 167h39l13 13 13-13h36"} stroke="#83BFD9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={mode === "register" ? "M307 126h42l14-14 15 14h30" : "M293 378h42l14 14 15-14h30"} stroke="#83BFD9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={mode === "register" ? "130" : "126"} cy={mode === "register" ? "361" : "167"} r="4" fill="#73B3D3" />
      <circle cx={mode === "register" ? "408" : "394"} cy={mode === "register" ? "126" : "378"} r="4" fill="#73B3D3" />
    </svg>
  );
}
