# STEP 5 산출물: 시큐어코딩 개선계획서

- 프로젝트명: 주요정보통신기반시설 가이드라인 기반 Web Application 취약점 점검 및 시큐어코딩
- 작성일: 2026-04-28
- 입력 문서: `docs/STEP4_화이트박스취약점진단수행서.md`
- 기준 문서
  - 주요정보통신기반시설 기술적 취약점 분석·평가방법 상세가이드(2026)
  - Python 시큐어코딩 가이드(2023)
  - Javascript 시큐어코딩 가이드(2023)
  - 운영 스킬: `kisa-webapp-vuln.skills`

---

## 1. STEP 5 목표

1. STEP4 취약 판정 항목(11개)에 대한 코드 수준 개선안 확정
2. 위험도 우선순위 기반 개선 일정 수립
3. 개선 후 재진단(STEP6) 테스트 케이스 정의

---

## 2. 개선 대상 요약

- 취약 항목(11개): `EP, IL, CF, BF, IA, IN, IS, SN, AE, AU, WM`
- N/A 유지 항목(5개): `SF, PR, FU, FD, CC`
- 양호 유지 항목(5개): `CI, SI, DI, XS, PV`

---

## 3. 개선 모듈(우선순위)

### M5-1. 인증/세션 강화 (BF, IA, IS)
- 개선 목표
  - 고정 초기 비밀번호 제거
  - 비밀번호 복잡도/이력/만료 정책 적용
  - SECRET_KEY 운영환경 강제
  - 토큰 무효화(로그아웃/강제 만료) 정책 적용
- 대상 파일
  - `backend/app/routers/auth.py`
  - `backend/app/routers/admin.py`
  - `backend/app/security.py`
  - `frontend/src/contexts/AuthContext.js`

### M5-2. 권한/정보노출 통제 (IN, IL, EP, AE)
- 개선 목표
  - `mypage/schedule-approved` 접근권한 재설계(관리자 또는 소유자만)
  - 오류 응답 표준화(내부 예외문구 비노출)
  - 관리자 진입 경로 보호(추가 검증/접근제어)
  - 프로덕션에서 `/docs`, `/redoc`, `/openapi.json` 비활성화
  - 루트 API 버전 정보 최소화
- 대상 파일
  - `backend/app/routers/mypage.py`
  - `backend/app/routers/admin.py`
  - `backend/app/routers/applications.py`
  - `backend/app/main.py`
  - `frontend/src/App.js`

### M5-3. 요청 위조/자동화/메소드 통제 (CF, AU, WM)
- 개선 목표
  - 상태변경 요청 CSRF 방어 토큰 또는 동일수준 대체 통제 적용
  - 로그인 시도 횟수 제한, 지연, 계정잠금 정책 적용
  - 불필요 HTTP Method 제한(`allow_methods` 최소화)
- 대상 파일
  - `backend/app/main.py`
  - `backend/app/routers/auth.py`
  - 공통 미들웨어(신규) 또는 API Gateway 설정

### M5-4. 전송구간 보안 강화 (SN)
- 개선 목표
  - API base URL의 HTTP 기본값 제거
  - HTTPS 미사용 환경 실행 차단/경고
  - 배포단 HSTS 정책 반영(인프라 연계)
  - 서버 보안헤더(CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) 적용
- 대상 파일
  - `frontend/src/services/api.js`
  - `backend/app/main.py`(보안 헤더 미들웨어)
  - 배포 설정 문서(`render.yaml`) 보완

---

## 4. 취약 항목별 상세 개선안

| 코드 | 취약 근거(요약) | 개선안(코드/설정) | 검증 기준(STEP6) |
|---|---|---|---|
| EP | 내부 예외 문자열 응답 노출 | 사용자 응답은 공통 메시지로 고정, 상세는 서버 로그만 기록 | 예외 유도 시 스택/내부문구 비노출 |
| IL | 승인자 전화번호 노출 범위 과다, DB 자격증명 폴백 노출, API 문서/버전 노출 | 응답 필드 최소화(마스킹), 권한별 응답 분리, 하드코딩 자격증명 제거, 프로덕션 문서 비활성화 | 일반사용자 계정으로 타인 PII 조회 불가 + 민감정보/문서 노출 차단 |
| CF | CSRF 토큰/검증 부재 | 상태변경 API에 CSRF 토큰 검증 또는 동등 보호체계 도입 | 토큰 없는 요청 차단 |
| BF | 고정 초기 비밀번호 사용 | 가입/권한승격 시 랜덤 임시비밀번호 + 강제 변경 플로우 + 비밀번호 복잡도 validator 적용 | 고정비밀번호 문자열 코드 제거 + 약한 비밀번호 거부 |
| IA | 추가 인증 절차 부재 | 중요 기능 재인증(비밀번호 재확인/OTP) 도입 | 중요 작업 시 추가 인증 요구 |
| IN | 권한 범위 과다 | owner/admin 검증 로직 강화 | 권한 없는 사용자 요청 403 반환 |
| IS | 기본 SECRET_KEY, 토큰 무효화 미흡, localStorage 저장 위험 | 운영키 필수화, jti/denylist 도입, 로그아웃 무효화, Refresh Token 전략 도입 검토 | 로그아웃 후 토큰 재사용 차단 |
| SN | HTTP 기본 URL 존재, 보안 헤더 부재 | 기본값도 HTTPS로 강제, HTTP 차단, 보안 헤더 일괄 적용 | 평문 전송 경로 제거 + 헤더 검증 통과 |
| AE | `/admin-login` 공개 경로 | 관리자 진입 경로 보호(추가 검증, 탐지/제한) | 관리자 페이지 접근 통제 강화 |
| AU | rate limit/lockout 미구현 | 로그인 시도 제한 + CAPTCHA/지연 적용 | 반복 요청 시 차단/지연 확인 |
| WM | CORS methods 전체 허용 | 실제 사용 메소드만 허용(GET/POST/PUT/DELETE 등 최소화) | TRACE/CONNECT 등 불필요 메소드 차단 |

---

## 5. 위험도 기반 우선순위

1. 1순위(즉시): BF, IS, IN, AU
2. 2순위(단기): EP, IL, CF, AE, WM
3. 3순위(보완): IA, SN

> 산정 근거: STEP4 위험도 결과표(전체 위험도 35~36 구간 우선)

---

## 6. 스크린샷 삽입 위치(STEP 5)

| SS-ID | 캡처 대상 | 보고서 위치 |
|---|---|---|
| SS-21 | BF/IS 개선 전후 코드 diff | 3장 > M5-1 |
| SS-22 | IN/IL 권한검증 개선 코드 | 3장 > M5-2 |
| SS-23 | CF/AU/WM 통제 적용 코드·설정 | 3장 > M5-3 |
| SS-24 | SN(HTTPS 강제) 설정 반영 | 3장 > M5-4 |
| SS-25 | STEP5 개선 우선순위 표 | 4장 > 우선순위 |

---

## 7. merged_findings(20건) → 개선 모듈 매핑(식별자 보존)

| finding ID | 파일:라인 | 가이드라인 항목 | 적용 모듈 | 우선순위 | 개선 핵심 |
|---|---|---|---|---|---|
| SECRET-init_db-17-a3f1 | `backend/app/init_db.py:17` | BF, IL | M5-1 | 1순위 | 하드코딩 비밀번호 제거 + 초기계정 생성정책 변경 |
| SECRET-init_db-30-b2c3 | `backend/app/init_db.py:30` | BF | M5-1 | 1순위 | 운영 초기 비밀번호 제거/강제변경 |
| SECRET-auth-22-c4d5 | `backend/app/routers/auth.py:22` | BF | M5-1 | 1순위 | 가입시 랜덤 임시비밀번호 + 복잡도 검증 |
| SECRET-admin-65-d5e6 | `backend/app/routers/admin.py:65` | BF | M5-1 | 1순위 | 권한승격 비밀번호 발급방식 교체 |
| JWT-security-8-e6f7 | `backend/app/security.py:8` | IS | M5-1 | 1순위 | SECRET_KEY 필수화(폴백 금지) |
| TOKEN-AuthContext-42-b5c6 | `frontend/src/contexts/AuthContext.js:42` | IS | M5-1 | 1순위 | 토큰 저장전략 개선(보호강화) |
| JWT-security-20-c6d7 | `backend/app/security.py:20` | IS | M5-1 | 2순위 | refresh/jti/denylist 전략 도입 |
| AUTHZ-mypage-34-e2f3 | `backend/app/routers/mypage.py:34` | IN, IL | M5-2 | 1순위 | owner/admin 권한검증 강화 |
| TAINT-mypage-40-f3a4 | `backend/app/routers/mypage.py:40` | IL, IN | M5-2 | 2순위 | phone_number 마스킹/최소화 |
| ERROR-applications-62-c0d1 | `backend/app/routers/applications.py:62` | EP | M5-2 | 2순위 | 예외 응답 표준화(내부문구 숨김) |
| ERROR-admin-124-d1e2 | `backend/app/routers/admin.py:124` | EP | M5-2 | 2순위 | 예외 노출 차단 + 서버 로그 분리 |
| CONFIG-database-11-a8b9 | `backend/app/database.py:11` | IL | M5-2 | 2순위 | DB 폴백 자격증명 제거 |
| DAST-docs-0-d7e8 | `https://parktel-backend.onrender.com/docs` | AE, IL | M5-2 | 2순위 | `/docs` `/redoc` `/openapi.json` 비활성화 |
| DAST-version-0-f9a0 | `https://parktel-backend.onrender.com/` | IL | M5-2 | 3순위 | 루트/헬스 응답 정보 최소화 |
| CONFIG-main-18-f7a8 | `backend/app/main.py:18` | CF, WM | M5-3 | 2순위 | CORS/메소드 허용 최소화 |
| BRUTE-auth-36-b9c0 | `backend/app/routers/auth.py:36` | AU, IA | M5-3 | 1순위 | 로그인 rate limit/지연/잠금 |
| BRUTE-auth-52-b1c2 | `backend/app/routers/auth.py:52` | AU, IA | M5-3 | 1순위 | 관리자 로그인 보호통제 강화 |
| DAST-headers-0-e8f9 | `https://parktel-backend.onrender.com/` | SN | M5-4 | 3순위 | 보안헤더(CSP/HSTS/XFO/XCTO/RP) 적용 |
| INPUT-notices-21-a0b1 | `backend/app/routers/notices.py:21` | XS(잠재) | M5-2 | 3순위 | 입력 정규화/출력 인코딩 예방적 강화 |
| PWD-schemas-71-a4b5 | `backend/app/schemas.py:71` | BF | M5-1 | 1순위 | 비밀번호 복잡도 validator 추가 |

---

## 8. 마일스톤 업데이트(모듈형 실행계획)

### 8.1 실행 모듈/완료기준
1. **M5-1 인증·세션 강화 (D+2)**
   - 완료조건: 하드코딩 비밀번호 0건, SECRET_KEY 폴백 제거, 로그아웃 토큰 재사용 차단
2. **M5-2 권한·정보노출 통제 (D+3)**
   - 완료조건: 타인 PII 조회 차단, 예외정보 비노출, 운영문서(`/docs` 등) 차단
3. **M5-3 위조·자동화·메소드 통제 (D+2)**
   - 완료조건: 로그인 rate limit 적용, CSRF 동등통제 적용, 불필요 메소드 차단
4. **M5-4 전송구간/보안헤더 강화 (D+1)**
   - 완료조건: HTTP 기본경로 제거, 핵심 보안헤더 응답 확인

### 8.2 최종 보고서 구조(가이드라인 정렬)
- 1장: 범위/자산/21항목 기준
- 2장: 화이트박스 진단방법(정적+동적)
- 3장: 항목별 결과(양호/취약/N/A, 증거, 위험도)
- 4장: merged_findings/통계 교차검증(20건, 6/8/4/2, duplicate_groups=2)
- 5장: 개선계획(M5-1~M5-4) 및 우선순위
- 6장: STEP6 재검증 결과(개선전/후 비교)

---

## 9. STEP6 재진단 케이스(확정)

- TC-01 BF: `init_db.py/auth.py/admin.py` 고정 비밀번호 문자열 제거 확인
- TC-02 IS: SECRET_KEY 미설정 시 앱 기동 실패 + 로그아웃 토큰 재사용 차단 확인
- TC-03 IN/IL: 일반사용자 계정으로 `schedule-approved` 접근 시 403 및 PII 마스킹 확인
- TC-04 EP: 예외 유도 요청 시 내부 스택/DB 오류문구 미노출 확인
- TC-05 AU/IA: 로그인 반복요청 시 throttling/lockout 동작 확인(일반/관리자)
- TC-06 CF/WM: CSRF 보호 없는 상태변경 요청 차단 + 허용메소드 최소화 확인
- TC-07 SN/AE: `/docs` `/redoc` `/openapi.json` 차단 및 보안헤더 응답 확인
- TC-08 XS(잠재): notices 입력/출력 인코딩 회귀 테스트

---

## 10. STEP 5 종료 기준

- [x] 11개 취약 항목의 개선안 설계 완료
- [x] 파일/함수 단위 수정 대상 확정
- [x] STEP6 재진단 케이스 정의
- [x] SS-21 ~ SS-25 자리 지정 완료

**종료 판정**: STEP5 완료 (STEP6 재검증 단계로 이관 가능)
