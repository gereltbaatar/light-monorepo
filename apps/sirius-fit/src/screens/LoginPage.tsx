import { StarsArt } from "@/app/login/_components/StarsArt";
import { LoginForm } from "@/app/login/_components/LoginForm";

interface LoginPageProps {
  next?: string;
  error?: string;
}

export default function LoginPage({ next, error }: LoginPageProps) {
  return (
    <main className="dark relative flex flex-1 overflow-hidden bg-background text-foreground">
      <StarsArt />
      <div className="relative z-10 mx-auto flex w-full max-w-[1460px] items-center justify-center px-4 py-12">
        <div className="w-full max-w-xs">
          <div className="flex items-center justify-center gap-3">
            <svg viewBox="88 56 420 420" className="size-12" aria-hidden>
              <path transform="translate(0 514) scale(0.1 -0.1)" fill="currentColor" d="M1812 4228 c-26 -33 -18 -134 19 -253 5 -16 29 -115 54 -220 25 -104 49 -206 55 -225 5 -19 24 -93 40 -165 32 -136 59 -246 134 -555 25 -102 59 -243 75 -313 33 -138 44 -167 65 -167 24 0 27 29 37 325 10 308 20 380 60 440 59 86 183 93 464 25 56 -14 393 -87 431 -93 44 -8 71 12 55 41 -11 21 -115 110 -361 309 -69 56 -168 136 -220 179 -124 101 -275 225 -495 404 -98 80 -208 169 -243 199 -95 79 -145 99 -170 69z M4780 3489 c-63 -10 -155 -25 -205 -34 -49 -8 -200 -33 -335 -55 -636 -105 -842 -141 -862 -151 -11 -6 -17 -16 -15 -22 5 -16 43 -23 272 -47 306 -32 334 -38 367 -70 32 -32 37 -74 14 -119 -8 -15 -122 -130 -253 -256 -349 -336 -361 -349 -389 -410 -53 -116 -54 -249 -1 -365 14 -30 34 -75 45 -100 52 -120 98 -222 129 -289 88 -192 52 -291 -106 -291 -65 1 -101 4 -406 35 -236 24 -283 19 -239 -26 18 -17 107 -58 584 -264 124 -54 302 -131 395 -173 207 -92 255 -100 306 -54 32 29 34 34 33 94 -1 35 -9 90 -17 123 -15 56 -22 85 -61 260 -9 39 -30 129 -47 200 -17 72 -37 159 -45 195 -7 36 -23 105 -34 154 -49 218 1 390 162 563 45 48 109 117 142 153 112 120 200 215 276 295 41 44 104 112 140 150 36 39 124 133 196 210 194 207 212 233 198 277 -13 42 -68 46 -244 17z M1973 2313 c-70 -71 -422 -439 -623 -653 -96 -102 -218 -230 -272 -285 -151 -155 -185 -212 -145 -242 35 -28 79 -23 392 41 94 19 301 60 460 91 251 49 553 108 945 186 178 35 228 82 184 175 -15 32 -70 80 -327 291 -143 117 -158 96 -81 -112 80 -217 67 -229 -232 -223 l-192 3 -44 30 c-91 64 -106 155 -60 360 11 50 31 135 43 190 25 113 30 186 12 192 -7 3 -34 -17 -60 -44z" />
            </svg>
            {/* <span className="font-space text-5xl leading-none font-bold tracking-[-0.04em]">
              TASK
            </span> */}
            <span className="text-2xl font-light text-muted-foreground">/</span>
            <span className="font-space text-5xl leading-none font-bold tracking-[-0.04em]">
              SIRIUS
            </span>
          </div>

          <LoginForm
            next={next}
            initialError={
              error === "oauth_failed"
                ? "Google-ээр нэвтэрч чадсангүй."
                : undefined
            }
          />
        </div>
      </div>
    </main>
  );
}
