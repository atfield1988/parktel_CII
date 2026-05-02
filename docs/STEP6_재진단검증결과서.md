# STEP 6 산출물: 재진단(개선 후 검증) 결과서

- 프로젝트명: 주요정보통신기반시설 가이드라인 기반 Web Application 취약점 점검 및 시큐어코딩
- 작성일: 2026-04-30
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

## 4. TC-01 ~ TC-08 재진단 상태

| TC | 항목 | 현재 상태 | 판정 |
|---|---|---|---|
| TC-01 | BF | 하드코딩 비밀번호 제거 코드 반영 완료 | 통과(코드기준) |
| TC-02 | IS | SECRET_KEY 필수화 반영, 토큰 무효화는 후속 필요 | 부분 통과 |
| TC-03 | IN/IL | schedule-approved 관리자 권한화 + 전화번호 마스킹 반영 | 통과(코드기준) |
| TC-04 | EP | 내부 예외 문자열 직접 노출 제거 반영 | 통과(코드기준) |
| TC-05 | AU/IA | 로그인 시도 제한(기초) 반영, lockout/CAPTCHA는 후속 필요 | 부분 통과 |
| TC-06 | CF/WM | 메소드 최소화 반영, CSRF 동등통제는 후속 필요 | 부분 통과 |
| TC-07 | SN/AE | docs 비활성화 코드/보안헤더 반영(배포 검증 대기) | 검증 대기 |
| TC-08 | XS(잠재) | 기존 양호 유지, 회귀테스트 대기 | 검증 대기 |

> 주의: 일부 항목은 운영 서버 배포 후 DAST 재검증이 필요함.

---

## 5. 최종 판정(현재는 전환 진행 중)

- 확정 완료: BF, IN/IL, EP, WM 관련 코드 수준 개선 반영
- 후속 필요: IS(토큰 무효화), AU/IA(고도화 통제), CF(동등통제), SN/AE(운영 반영 확인)
- 따라서 본 문서는 "개선 반영 진행판"이며, 배포 후 최종 판정표를 한 번 더 업데이트해야 함

---

## 6. 남은 작업 체크리스트

1. 배포 반영 후 DAST 재실행
   - `/docs`, `/redoc`, `/openapi.json` 차단 여부
   - CSP/HSTS/XFO/XCTO/Referrer-Policy 헤더 확인
2. 인증 보강
   - 토큰 무효화(denylist/jti 또는 세션전략) 구현
   - 관리자 로그인 추가 인증(재인증/2차 인증) 검토
3. 요청 위조/자동화 보강
   - CSRF 동등통제(예: Origin 검증 + 사용자 상호작용 토큰)
   - lockout/captcha 등 고도화 통제 추가
4. STEP6 최종판정표(양호/취약/N/A) 재확정 및 보고서 반영

---

## 7. 증적 참조

- 코드 근거: `backend/app/init_db.py`, `backend/app/routers/auth.py`, `backend/app/routers/admin.py`, `backend/app/routers/applications.py`, `backend/app/routers/mypage.py`, `backend/app/security.py`, `backend/app/database.py`, `backend/app/main.py`
- 프론트 근거: `frontend/src/pages/Register.js`, `frontend/src/pages/AdminLogin.js`, `frontend/src/services/api.js`
- 운영 재검증 대상: `https://parktel-backend.onrender.com/docs`, `/redoc`, `/openapi.json`, `/`
- 증적 이미지: `docs/assets/SS-01` ~ `SS-05`
