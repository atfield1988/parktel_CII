# STEP 6 산출물: 재진단(개선 후 검증) 결과서

- 프로젝트명: 주요정보통신기반시설 가이드라인 기반 Web Application 취약점 점검 및 시큐어코딩
- 작성일: 2026-04-30 (최종 업데이트: 2026-05-02)
- 입력 문서
  - `docs/STEP4_화이트박스취약점진단수행서.md`
  - `docs/STEP5_시큐어코딩개선계획서.md`
- 진단 방식: 화이트박스 재검증(정적 코드 검토 + 운영 엔드포인트 확인)

---

## 1. STEP 6 목표

1. STEP5 개선대상(EP, IL, CF, BF, IA, IN, IS, SN, AE, AU, WM)의 개선 반영 여부 재검증
2. TC-01 ~ TC-08 재진단 케이스 수행
3. 최종 판정(양호/취약/N/A) 업데이트 및 잔여 리스크 확정

---

## 2. 재검증 기준

- 판정: `양호` / `취약` / `N/A`
- 위험평가 모델: `위험평가 보고서.xlsx` 산식 유지
- 보존 식별자: merged_findings 20건 ID/파일/라인/URL/심각도(6/8/4/2), duplicate_groups=2

---

## 3. STEP6 진행 현황(2단계)

### 3.1 1단계(베이스라인 재확인) — 완료

- 운영 엔드포인트 기준(`/docs`, `/redoc`, `/openapi.json`) 노출 상태 및 보안헤더 미설정 재확인
- 개선 전 판정(양호 5 / 취약 11 / N/A 5) 기준선 확보 완료

### 3.2 2단계(코드 개선 반영) — 1차 완료

다음 항목은 `parktel_CII` 저장소 코드에 적용 완료:

- BF: 하드코딩 비밀번호 제거
  - `backend/app/init_db.py` (초기 계정 비밀번호를 환경변수 기반으로 전환)
  - `backend/app/routers/auth.py` (회원가입 시 사용자 입력 비밀번호 사용)
  - `backend/app/routers/admin.py` (권한 부여 시 랜덤 임시비밀번호 발급)
- IS: `SECRET_KEY` 필수화
  - `backend/app/security.py` (미설정 시 RuntimeError)
- IL: DB 자격증명 하드코딩 폴백 제거
  - `backend/app/database.py` (DATABASE_URL 필수화)
- EP: 상세 예외문구 외부 노출 제거
  - `backend/app/routers/admin.py`
  - `backend/app/routers/applications.py`
- IN/IL: 승인자 조회 권한 강화 및 전화번호 마스킹
  - `backend/app/routers/mypage.py`
- AU: 로그인 시도 제한(기초)
  - `backend/app/routers/auth.py` (in-memory rate limit)
- WM/AE/SN: 문서 노출/메소드/헤더 하드닝 코드 반영
  - `backend/app/main.py` (운영 기본 docs 비활성화, CORS 최소화, 보안헤더 미들웨어)
  - `frontend/src/services/api.js` (운영 기본 HTTPS)
  - `frontend/src/pages/AdminLogin.js` (초기 비밀번호 노출 문구 제거)
  - `frontend/src/pages/Register.js`, `backend/app/schemas.py` (비밀번호 강도 검증 흐름 반영)

---

## 4. 운영 URL 기준 재검증 결과(2026-05-02)

- Backend: `https://parktel-backend-resu.onrender.com`
- Frontend: `https://parktel-frontend-resu.onrender.com`

### 4.1 검증 로그(HTTP 코드/헤더)

1) Health Check
- `GET /health` → `200`

2) 운영 문서 노출 차단
- `GET /docs` → `404`
- `GET /redoc` → `404`
- `GET /openapi.json` → `404`

3) 보안 헤더
- `Content-Security-Policy: default-src 'self'`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: same-origin`

4) CORS 정책
- 허용 Origin(`https://parktel-frontend-resu.onrender.com`) Preflight: `Access-Control-Allow-Origin` 정상 반환
- 비허용 Origin(`https://evil.example`) Preflight: `Access-Control-Allow-Origin`가 비허용 Origin으로 반환됨 → **정책 미충족(취약)**

5) 인증/자동화 방어
- `/api/auth/login` 반복 실패 6회 테스트
  - 1~5회: `404`(사용자 없음)
  - 6회: `429`(로그인 시도 과다)

---

## 5. TC-01 ~ TC-08 최종 판정(운영 검증 반영)

| TC | 항목 | 근거 | 최종 판정 |
|---|---|---|---|
| TC-01 | BF | 하드코딩 비밀번호 제거(`init_db.py`, `auth.py`, `admin.py`) 확인 | 양호 |
| TC-02 | IS | `SECRET_KEY` 필수화는 반영, 토큰 무효화(denylist/jti) 미구현 | 부분 양호 |
| TC-03 | IN/IL | 관리자 권한화 + 전화번호 마스킹(`mypage.py`) 반영 | 양호 |
| TC-04 | EP | 내부 예외 상세 문구 외부 노출 제거(`admin.py`, `applications.py`) | 양호 |
| TC-05 | AU/IA | 로그인 반복 실패 시 `429` 확인(기초 rate-limit 동작) | 양호(기초) |
| TC-06 | CF/WM | 메소드 최소화는 반영, CSRF 동등통제/Origin 강제 미흡(CORS 비허용 Origin 허용) | 취약 |
| TC-07 | SN/AE | `/docs`·`/redoc`·`/openapi.json` 차단 + 보안헤더 운영 반영 확인 | 양호 |
| TC-08 | XS(잠재) | 공지 입력/출력 회귀테스트는 별도 수행 필요, 코드상 정책 유지 | 양호(코드기준) |

---

## 6. 시큐어코딩 적용 비교표(기존 취약점 ↔ 개선 상태)

| 코드 위치 | 기존 취약점 | 현재 시큐어코딩 상태 |
|---|---|---|
| `backend/app/security.py` | `SECRET_KEY` 기본값 fallback 사용 | 환경변수 필수화(미설정 시 예외) |
| `backend/app/init_db.py` | 초기 관리자 계정 비밀번호 하드코딩 | 초기 계정 비밀번호를 환경변수로 분리 |
| `backend/app/routers/auth.py` | 회원가입 시 고정 초기 비밀번호(`abcd1234`) | 사용자 입력 비밀번호 해시 저장 |
| `backend/app/routers/auth.py` | 로그인 무차별대입 방어 미흡 | in-memory rate-limit 적용(6회차 429 확인) |
| `backend/app/routers/admin.py` | admin 부여 시 고정 비밀번호 사용 | 랜덤 임시 비밀번호 발급으로 전환 |
| `backend/app/database.py` | DB 연결정보 fallback 허용 | `DATABASE_URL` 필수화 |
| `backend/app/main.py` | 운영 문서 노출 가능, CORS/메소드 광범위 허용 | docs 기본 비활성화, 헤더/메소드 제한 적용(단 CORS 추가 보완 필요) |
| `backend/app/routers/mypage.py` | 승인자 목록/전화번호 과노출 | 관리자 전용 + 전화번호 마스킹 |
| `backend/app/schemas.py` | 비밀번호 강도 검증 미흡 | 길이/대소문자/숫자/특수문자 강도검증 적용 |
| `frontend/src/pages/AdminLogin.js` | 초기 비밀번호 힌트 노출 | 힌트 제거 |
| `frontend/src/services/api.js` | 운영 URL 안전성 기준 미흡 | 운영 기본 API URL HTTPS 고정 |

---

## 7. 가이드라인 매핑(주요정보통신기반시설 / Python / JavaScript)

- BF(취약한 비밀번호):
  - 주요정보통신기반시설: 취약한 비밀번호 설정 금지
  - Python 시큐어코딩: 하드코딩 자격증명 금지, 입력 비밀번호 강도검증
  - JavaScript 시큐어코딩: UI/로그/placeholder 내 민감정보 노출 금지
- IS(세션 관리):
  - 주요정보통신기반시설: 세션키/토큰 안전관리
  - Python 시큐어코딩: 비밀키 환경변수 분리, 토큰 무효화/재사용 방지
- IL/IN(정보노출/인가):
  - 주요정보통신기반시설: 최소권한, 개인정보 최소노출
  - Python 시큐어코딩: 권한검사 선행, 민감정보 마스킹
- AE/SN(관리자/전송보안):
  - 주요정보통신기반시설: 운영 문서/관리기능 외부노출 금지, 전송구간 보안 헤더 적용
  - Python/JavaScript 시큐어코딩: HTTPS 강제, 보안 헤더 설정
- AU/WM/CF(자동화/메소드/요청위조):
  - 주요정보통신기반시설: 자동화 공격 차단, 불필요 메소드 차단, 요청 위조 방지
  - Python 시큐어코딩: rate-limit/lockout, CSRF 동등통제, CORS 최소허용

---

## 8. 최종 결론 및 잔여 보완

- **양호 확정:** BF, IN/IL, EP, SN/AE, AU(기초), WM(부분)
- **미완료/취약:** CF/WM 영역의 CORS 정책 미충족(비허용 Origin 차단 실패), IS의 토큰 무효화 미구현
- **즉시 조치 필요:**
  1. Render 환경변수 `ALLOWED_ORIGINS`를 프론트 도메인 단일값으로 고정 후 재배포
  2. Preflight 재검증 시 비허용 Origin에서 `Access-Control-Allow-Origin` 미반환 확인
  3. 토큰 무효화 전략(denylist/jti) 추가 후 TC-02 재판정

---

## 9. 증적 참조

- 코드 근거: `backend/app/init_db.py`, `backend/app/routers/auth.py`, `backend/app/routers/admin.py`, `backend/app/routers/applications.py`, `backend/app/routers/mypage.py`, `backend/app/security.py`, `backend/app/database.py`, `backend/app/main.py`
- 프론트 근거: `frontend/src/pages/Register.js`, `frontend/src/pages/AdminLogin.js`, `frontend/src/services/api.js`
- 운영 재검증 URL: `https://parktel-backend-resu.onrender.com`, `https://parktel-frontend-resu.onrender.com`
- 증적 이미지: `docs/assets/SS-01` ~ `SS-05`
