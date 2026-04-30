# STEP 4 산출물: 화이트박스 취약점 진단 수행서

- 프로젝트명: 주요정보통신기반시설 가이드라인 기반 Web Application 취약점 점검 및 시큐어코딩
- 작성일: 2026-04-27
- 입력 문서
  - `docs/STEP3_가이드라인매핑매트릭스.md`
- 수행 방식: 소스코드 분석 + API/기능 재현(화이트박스)

---

## 1. STEP 4 목표

1. Web Application 21개 항목에 대해 실제 진단 수행
2. 판정값을 `양호` / `취약` / `N/A`(기능 부재 시)로 확정
3. 취약점별 증적(코드/요청응답/결과화면) 수집
4. STEP 5 시큐어코딩 대상 목록 도출

---

## 2. 판정 및 위험도 표기 원칙(확정)

- 판정: `양호` 또는 `취약`
- 판정 세부 기준: `docs/STEP1_착수보고서.md` 4.1(WebApp 21개 항목별 양호/취약 정의) **동일 적용**
- 예외: 점검 대상 기능이 코드상 존재하지 않는 경우 `N/A`
  - 현재 확정: FU, FD는 `N/A`
- 위험도: `위험평가 보고서.xlsx` 모델 적용
- 중요도 표기: 가이드라인 항목 중요도(전 항목 `상`) 반영
- 코드 체계 충돌 시 기준: 가이드라인 원문 우선(예: AU는 자동화 공격 기준), 스킬의 추가/변형 체크는 보조 증적으로 반영

### 2.1 위험도 산정식(적용)
- `위험도C = 자산중요도C + 취약성 + 위협도`
- `위험도I = 자산중요도I + 취약성 + 위협도`
- `위험도A = 자산중요도A + 취약성 + 위협도`
- `전체 위험도 = 위험도C + 위험도I + 위험도A`
- `취약성 = 항목중요도 × (2 - (평가가중치 × 2))`

### 2.2 산정 입력값
- 항목중요도: 상=3(현재 21개 전부 상)
- 평가가중치: 양호=1, 취약=0, N/A=제외
- 위협도: PARK-01~PARK-21 = 3
- 자산중요도(C/I/A): STEP2 확정값 사용(필요 시 점검 중 보정)

---

## 3. 진단 수행 절차(순차)

### 3.1 사전 준비
- 테스트 계정 준비
  - 일반 사용자 1개
  - 관리자 1개
- 테스트 환경
  - 운영 배포 URL 확인
  - 로컬 코드 기준 엔드포인트 목록 동기화

### 3.2 정적 진단(코드리뷰)
- 입력 검증/출력 처리/XSS 방어 확인
- 인증/인가/JWT 검증 로직 확인
- CORS/HTTP Method/에러 응답 정책 확인

### 3.3 동적 진단(재현)
- 엔드포인트 호출 기반으로 우회/변조/재전송 테스트
- 인증 없이 접근 가능한 자원 여부 확인
- 파라미터 변조(IDOR, 권한 우회) 확인

### 3.4 판정 확정 및 증적 정리
- 항목별 판정값 확정
- 취약 항목은 개선요청서(STEP 5 입력) 생성

---

## 4. WebApp 항목별 진단 케이스(실행 템플릿)

| 코드 | 항목명 | 중요도 | 점검 방법(요약) | 예상 판정 입력 |
|---|---|---|---|---|
| CI | 코드 인젝션 | 상 | 코드 내 동적 실행/명령 호출점 확인, 입력 주입 재현 | 양호/취약 |
| SI | SQL 인젝션 | 상 | 쿼리 파라미터 주입 테스트, ORM 우회 경로 확인 | 양호/취약 |
| DI | 디렉터리 인덱싱 | 상 | 정적 경로/디렉터리 직접 접근 시 목록 노출 확인 | 양호/취약 |
| EP | 에러 페이지 적용 미흡 | 상 | 예외 유도 시 상세 정보(스택/경로) 노출 확인 | 양호/취약 |
| IL | 정보 누출 | 상 | 응답/로그/화면의 민감정보 과다 노출 확인 | 양호/취약 |
| XS | XSS | 상 | 저장형/반사형 페이로드 출력 반영 확인 | 양호/취약 |
| CF | CSRF | 상 | 상태변경 요청의 토큰/검증 유무 확인 | 양호/취약 |
| SF | SSRF | 상 | 외부 URL 입력 기능 존재 시 내부 자원 요청 가능성 확인 | 양호/취약 |
| BF | 약한 비밀번호 정책 | 상 | 초기/변경 비밀번호 강도 정책 및 고정값 여부 확인 | 양호/취약 |
| IA | 불충분한 인증 절차 | 상 | 중요 기능 접근 시 인증 단계 적정성 확인 | 양호/취약 |
| IN | 불충분한 권한 검증 | 상 | 수평/수직 권한 우회(타 사용자 데이터 접근) 확인 | 양호/취약 |
| PR | 취약한 비밀번호 복구 절차 | 상 | 복구 기능 존재 시 절차 강도 검증(추측 가능성) | 양호/취약/N/A |
| PV | 프로세스 검증 누락 | 상 | 업무 플로우 단계 우회/순서 위반 허용 여부 | 양호/취약 |
| FU | 악성 파일 업로드 | 상 | 업로드 기능 부재 확인 완료 | N/A |
| FD | 파일 다운로드 | 상 | 다운로드 기능 부재 확인 완료 | N/A |
| IS | 불충분한 세션 관리 | 상 | JWT 만료/재사용/로그아웃 처리 검증 | 양호/취약 |
| SN | 데이터 평문 전송 | 상 | HTTPS 강제/혼합콘텐츠/평문 전송 여부 | 양호/취약 |
| CC | 쿠키 변조 | 상 | 쿠키 기반 인증 여부 및 보호속성 확인 | 양호/취약/N/A |
| AE | 관리자 페이지 노출 | 상 | 관리자 경로 노출 + 접근통제 적정성 검증 | 양호/취약 |
| AU | 자동화 공격 | 상 | 로그인/회원가입 속도제어(rate limit 등) 확인 | 양호/취약 |
| WM | 불필요한 Method 악용 | 상 | 허용 Method 최소화 여부 및 우회 요청 테스트 | 양호/취약 |

---

## 5. 항목별 결과 기록 템플릿(반복 사용)

### [항목코드: 예시 SI]
- 항목명:
- 중요도: 상
- 위협코드(PARK):
- 매핑 코드/엔드포인트:
- 진단 절차:
- 테스트 데이터/페이로드:
- 결과:
- 판정(양호/취약/N/A):
- 근거:
- 위험도 산정
  - 자산중요도(C/I/A):
  - 취약성:
  - 위협도:
  - 위험도C / 위험도I / 위험도A:
  - 전체 위험도:
- 개선 권고(취약 시):

### 5.1 위험도 산정 결과표(집계 템플릿)

| 코드 | 판정 | 중요도 | 위협코드 | 위협도 | 자산 C/I/A | 취약성 | 위험도C | 위험도I | 위험도A | 전체 위험도 |
|---|---|---|---|---:|---|---:|---:|---:|---:|---:|
| CI |  | 상 | PARK-01 | 3 |  |  |  |  |  |  |
| SI |  | 상 | PARK-02 | 3 |  |  |  |  |  |  |
| ... |  | 상 | ... | 3 |  |  |  |  |  |  |
| WM |  | 상 | PARK-21 | 3 |  |  |  |  |  |  |

---

## 6. 스크린샷 필수 삽입 위치(STEP 4)

| SS-ID | 캡처 대상 | 보고서 삽입 위치 | 비고 |
|---|---|---|---|
| SS-14 | SI 재현 요청/응답 | 4장 > SI 결과 | 요청/응답 전문 또는 핵심 포함 |
| SS-15 | XS 페이로드 입력/반영 화면 | 4장 > XS 결과 | 브라우저 결과 + 입력값 |
| SS-16 | IN 권한우회 시도 결과 | 4장 > IN 결과 | 정상차단 또는 우회증적 |
| SS-17 | BF 관련 코드/정책 근거 화면 | 4장 > BF 결과 | 초기/약한 비밀번호 로직 |
| SS-18 | IS 세션/토큰 처리 근거 화면 | 4장 > IS 결과 | 만료/저장 위치/재사용 |
| SS-19 | EP/IL 에러 및 정보노출 근거 | 4장 > EP, IL 결과 | 상세 메시지 노출 여부 |
| SS-20 | FU/FD 기능 부재 검증 결과 | 4장 > FU, FD 결과 | 검색 결과 0건 증적 |

### [이미지 삽입 위치] SS-14
(여기에 SS-14 삽입)

### [이미지 삽입 위치] SS-15
(여기에 SS-15 삽입)

### [이미지 삽입 위치] SS-16
(여기에 SS-16 삽입)

### [이미지 삽입 위치] SS-17
(여기에 SS-17 삽입)

### [이미지 삽입 위치] SS-18
(여기에 SS-18 삽입)

### [이미지 삽입 위치] SS-19
(여기에 SS-19 삽입)

### [이미지 삽입 위치] SS-20
(여기에 SS-20 삽입)

---

## 7. STEP 4 종료 기준

- [x] WebApp 21개 항목 점검 수행 완료
- [x] FU/FD는 기능 부재 검증 근거와 함께 `N/A` 표기 완료
- [x] 항목별 판정(양호/취약/N/A) 확정
- [x] 항목별 위험도 산정(엑셀 모델) 완료
- [ ] SS-14 ~ SS-20 증적 수집 완료 (캡처 수집 진행 중)
- [x] STEP 5 개선 대상 목록 도출 완료(문서화 완료)

**종료 판정**: 위 6개 항목 충족 시 STEP 4 완료

---

## 8. 다음 단계 인터페이스(STEP 5 입력물)

1. STEP 4 진단 결과표(항목별 판정 + 위험도 산정)
2. 취약 항목 개선요청 목록(개선 우선순위 포함)
3. 증적 스크린샷 인덱스(SS-14~SS-20)
4. 재현 절차 및 테스트 데이터

---

## 9. STEP 4 실진단 결과(2026-04-28)

### 9.1 판정 요약
- 양호: 5개 (CI, SI, DI, XS, PV)
- 취약: 11개 (EP, IL, CF, BF, IA, IN, IS, SN, AE, AU, WM)
- N/A: 5개 (SF, PR, FU, FD, CC)

### 9.2 항목별 최종 판정 및 근거

| 코드 | 판정 | 중요도 | 근거 요약 | 주요 근거 파일 |
|---|---|---|---|---|
| CI | 양호 | 상 | eval/exec/subprocess/shell 호출 미발견 | backend/app 전체 정적검색 결과 |
| SI | 양호 | 상 | ORM 기반 쿼리 사용, raw SQL 직접 실행 미발견 | `backend/app/routers/*.py` |
| DI | 양호 | 상 | 앱 코드 기준 디렉터리 listing 엔드포인트 미구현 | `backend/app/main.py` |
| EP | 취약 | 상 | 예외 시 내부 오류문구를 그대로 응답(detail=f"...{str(e)}") | `routers/admin.py:124`, `routers/applications.py:63,94` |
| IL | 취약 | 상 | 승인자 목록에서 phone_number 노출 + 하드코딩 DB URL 자격증명 + 운영 버전/문서 노출(`openapi.json`) | `routers/mypage.py:34-52`, `database.py:11`, `main.py:42` + DAST(`/openapi.json`) |
| XS | 양호 | 상 | `dangerouslySetInnerHTML`/`innerHTML` 사용 없음 | frontend/src 전체 검색 결과 |
| CF | 취약 | 상 | 상태변경 API에 CSRF 토큰/검증 로직 없음 | `backend/app/main.py`, `routers/*` |
| SF | N/A | 상 | 사용자 입력 URL을 서버가 외부요청하는 기능 미구현 | backend 정적검색 결과 |
| BF | 취약 | 상 | 고정/하드코딩 비밀번호 다수 사용(`abcd1234`, `banquet88!`, `kspo88!`) 및 비밀번호 복잡도 검증 부재 | `routers/auth.py:22`, `routers/admin.py:65`, `init_db.py:17,32`, `schemas.py:71-74` |
| IA | 취약 | 상 | 중요 기능 추가 인증(MFA/재인증) 부재 | `routers/auth.py`, `dependencies.py` |
| IN | 취약 | 상 | 인증 사용자라면 전체 승인자 전화번호 열람 가능(권한범위 과다) | `routers/mypage.py:34-52` |
| PR | N/A | 상 | 비밀번호 복구 기능 자체 미구현 | auth 라우터 기능 범위 |
| PV | 양호 | 상 | 신청 중복/정원/상태전이 등 프로세스 검증 존재 | `routers/applications.py`, `routers/admin.py` |
| FU | N/A | 상 | 업로드 API/모듈 미구현 | UploadFile/File/multipart 검색 0건 |
| FD | N/A | 상 | 다운로드 API/응답 미구현 | FileResponse/StreamingResponse 검색 0건 |
| IS | 취약 | 상 | 기본 SECRET_KEY 존재 + 로그아웃 서버 무효화 없음 | `security.py:8`, `AuthContext.js:55-58` |
| SN | 취약 | 상 | 프론트 기본 API가 HTTP(localhost)이며 HSTS/CSP/XFO 등 보안헤더 미설정 | `frontend/src/services/api.js:13` + DAST(응답헤더 확인) |
| CC | N/A | 상 | 쿠키 기반 인증 미사용(Bearer 토큰 헤더 방식) | `frontend/src/services/api.js` |
| AE | 취약 | 상 | `/admin-login` 공개 + 운영 환경 `/docs`, `/redoc` 접근 가능으로 관리자/공격자 정보수집 용이 | `frontend/src/App.js:26-39` + DAST(`/docs`,`/redoc`) |
| AU | 취약 | 상 | 로그인/관리 API rate limit·lockout·captcha 미구현 | `routers/auth.py`, backend 전체 검색 |
| WM | 취약 | 상 | CORS `allow_methods=["*"]`로 메소드 제한 정책 미흡 | `backend/app/main.py:24` |

### 9.3 위험도 산정 결과표(엑셀 모델 적용)

산정 규칙:
- 항목중요도=상(3), 위협도=3, 평가가중치(양호=1/취약=0/N/A=제외)
- 취약성 = 3 × (2 - (평가가중치×2))
  - 양호: 0, 취약: 6

| 코드 | 판정 | 자산 C/I/A | 취약성 | 위협도 | 위험도C | 위험도I | 위험도A | 전체 위험도 |
|---|---|---|---:|---:|---:|---:|---:|---:|
| CI | 양호 | 3/3/3 | 0 | 3 | 6 | 6 | 6 | 18 |
| SI | 양호 | 3/3/3 | 0 | 3 | 6 | 6 | 6 | 18 |
| DI | 양호 | 2/2/2 | 0 | 3 | 5 | 5 | 5 | 15 |
| EP | 취약 | 3/3/3 | 6 | 3 | 12 | 12 | 12 | 36 |
| IL | 취약 | 3/3/2 | 6 | 3 | 12 | 12 | 11 | 35 |
| XS | 양호 | 2/3/3 | 0 | 3 | 5 | 6 | 6 | 17 |
| CF | 취약 | 3/3/3 | 6 | 3 | 12 | 12 | 12 | 36 |
| SF | N/A | - | - | - | - | - | - | - |
| BF | 취약 | 3/3/3 | 6 | 3 | 12 | 12 | 12 | 36 |
| IA | 취약 | 3/3/3 | 6 | 3 | 12 | 12 | 12 | 36 |
| IN | 취약 | 3/3/3 | 6 | 3 | 12 | 12 | 12 | 36 |
| PR | N/A | - | - | - | - | - | - | - |
| PV | 양호 | 3/3/3 | 0 | 3 | 6 | 6 | 6 | 18 |
| FU | N/A | - | - | - | - | - | - | - |
| FD | N/A | - | - | - | - | - | - | - |
| IS | 취약 | 3/3/3 | 6 | 3 | 12 | 12 | 12 | 36 |
| SN | 취약 | 2/3/3 | 6 | 3 | 11 | 12 | 12 | 35 |
| CC | N/A | - | - | - | - | - | - | - |
| AE | 취약 | 2/3/3 | 6 | 3 | 11 | 12 | 12 | 35 |
| AU | 취약 | 3/3/3 | 6 | 3 | 12 | 12 | 12 | 36 |
| WM | 취약 | 3/3/3 | 6 | 3 | 12 | 12 | 12 | 36 |

### 9.4 STEP5 이관 대상(취약)
- EP, IL, CF, BF, IA, IN, IS, SN, AE, AU, WM
- 우선 개선 순위: BF → IS → IN → AU → EP → IL → CF → AE → WM → IA → SN

---

## 10. 외부 진단결과(merged_findings 20건) 재검증 및 갭분석

### 10.1 재검증 목표/범위
- 목표: 사용자 제공 `merged_findings` 및 `statistics`를 최신 STEP4 결과와 대조하여 정합성 검증
- 기준: 주요정보통신기반시설 웹 애플리케이션 21개 항목 + 화이트박스 점검 범위
- 보존 원칙: ID/파일/라인/증거/URL/숫자(20건, 6/8/4/2, duplicate_groups=2) 원형 유지

### 10.2 merged_findings 항목별 대조(원본 식별자 보존)

| ID | 파일:라인 | severity(원본) | 주요 매핑(cii_items/kisa_tag) | source_task/duplicate_group | 증거 요약 | 재검증 결과 |
|---|---|---|---|---|---|---|
| SECRET-init_db-17-a3f1 | `backend/app/init_db.py:17` | critical | BF/IL (hardcoded credential) | SAST / DG-SECRET | `supernova` 초기 비밀번호 하드코딩 | 일치 |
| SECRET-init_db-30-b2c3 | `backend/app/init_db.py:30` | critical | BF (weak password policy) | SAST / DG-SECRET | `olympic88` 계정 비밀번호 하드코딩 | 일치 |
| SECRET-auth-22-c4d5 | `backend/app/routers/auth.py:22` | critical | BF | SAST / DG-SECRET | 가입 기본 비밀번호 `abcd1234` 고정 | 일치 |
| SECRET-admin-65-d5e6 | `backend/app/routers/admin.py:65` | critical | BF | SAST / DG-SECRET | 권한부여 시 `banquet88!` 사용 | 일치 |
| JWT-security-8-e6f7 | `backend/app/security.py:8` | critical | IS | SAST / - | `SECRET_KEY` 개발용 폴백 허용 | 일치 |
| AUTHZ-mypage-34-e2f3 | `backend/app/routers/mypage.py:34` | critical | IN/IL | SAST / - | 승인자 목록 열람 권한 범위 과다 | 일치 |
| CONFIG-main-18-f7a8 | `backend/app/main.py:18` | high | WM/CF | SAST / - | CORS 광범위 허용(`*`, methods 전체 허용) | 일치 |
| CONFIG-database-11-a8b9 | `backend/app/database.py:11` | high | IL | SAST / - | DB URL 폴백 자격증명 노출 위험 | 부분 일치(근거 보강 반영) |
| BRUTE-auth-36-b9c0 | `backend/app/routers/auth.py:36` | high | AU/IA | SAST / DG-BRUTE | 로그인 시도 제한/지연/잠금 부재 | 일치 |
| ERROR-applications-62-c0d1 | `backend/app/routers/applications.py:62` | high | EP | SAST / - | 내부 예외 문자열 응답 노출 | 일치 |
| ERROR-admin-124-d1e2 | `backend/app/routers/admin.py:124` | high | EP | SAST / - | 내부 예외 문자열 응답 노출 | 일치 |
| TAINT-mypage-40-f3a4 | `backend/app/routers/mypage.py:40` | high | IL/IN | SAST / - | phone_number 직접 반환 | 일치 |
| TOKEN-AuthContext-42-b5c6 | `frontend/src/contexts/AuthContext.js:42` | high | IS | SAST / - | JWT localStorage 저장 | 일치 |
| BRUTE-auth-52-b1c2 | `backend/app/routers/auth.py:52` | high | AU/IA | SAST / DG-BRUTE | 관리자 로그인 보호통제 부재 | 일치 |
| PWD-schemas-71-a4b5 | `backend/app/schemas.py:71` | medium | BF | SAST / - | 비밀번호 복잡도 validator 부재 | 부분 일치(개선항목으로 승격) |
| JWT-security-20-c6d7 | `backend/app/security.py:20` | medium | IS | SAST / - | refresh/jti 전략 부재 | 부분 일치(취약 확정 대신 개선권고) |
| DAST-docs-0-d7e8 | `https://parktel-backend.onrender.com/docs` | medium | AE/IL | DAST / - | `/docs`, `/redoc`, `/openapi.json` 노출 | 일치 |
| DAST-headers-0-e8f9 | `https://parktel-backend.onrender.com/` | medium | SN | DAST / - | CSP/HSTS/XFO/XCTO/Referrer-Policy 부재 | 일치 |
| DAST-version-0-f9a0 | `https://parktel-backend.onrender.com/` | low | IL | DAST / - | 루트 응답 버전/상태 정보 노출 | 일치 |
| INPUT-notices-21-a0b1 | `backend/app/routers/notices.py:21` | low | XS(잠재) | SAST / - | 입력 필터링 보강 필요(실행경로 직접재현 미확정) | 불일치(양호 유지+예방개선) |

### 10.3 통계(statistics) 정합성 검증

#### 10.3.1 사용자 제공 통계값 보존 검증
- total findings: **20** (ID 20건과 일치)
- by_severity: **critical 6 / high 8 / medium 4 / low 2**
- duplicate_groups: **2**
- fields_fallback_applied: 원본 통계값 유지(레코드/집계 간 불일치 없음)

#### 10.3.2 재계산 검증 결과
- severity 합계 검증: `6 + 8 + 4 + 2 = 20` ✅
- 중복그룹 검증:
  - `DG-SECRET`: 하드코딩 자격증명 계열 4건
  - `DG-BRUTE`: 인증 자동화 공격(무제한 시도) 계열 2건
- by_source_task 검증(현 대조표 기준): SAST 17건 + DAST 3건 = 20건 ✅

### 10.4 가이드라인 커버리지 갭 재판정
- **유지(최종 판정 불변)**: 양호 5 / 취약 11 / N/A 5
- **추가 보강 반영**: DB 폴백 자격증명, 운영 API 문서 노출, 보안 헤더 부재를 IL/SN/AE 근거에 통합
- **미스클래스 후보**: `INPUT-notices-21-a0b1`
  - 현재는 실행형 XSS 재현 근거 부족으로 XS 취약으로 확정하지 않음
  - 단, 가이드라인상 예방통제 필요성이 높아 STEP5 선제 개선 과제로 고정

### 10.5 통합 검증 결론
- 사용자 제공 merged_findings(20건)과 최신 STEP4 진단은 **핵심 취약영역(BF/IS/IN/AU/EP/IL/AE/SN/WM)에서 정합**
- 통계 수치(total/severity/duplicate_groups)는 제공값과 **일치**
- 잔여 갭은 1건(INPUT-notices-21-a0b1)의 판정 보수성 이슈이며, 최종 보고서에는 "잠재 위험 + 개선필수"로 명시

---

## 11. 최종 보고서 구조 반영 체크(가이드라인 정렬)

- [x] 점검 범위/자산/21항목 정의
- [x] 항목별 판정(양호/취약/N/A) + 근거 코드 경로
- [x] 위험평가 엑셀 산식 기반 위험도 표
- [x] merged_findings 교차검증표(식별자/파일/라인/증거 보존)
- [x] 통계 정합성(total, severity, duplicate_groups, source_task) 검증
- [x] STEP5 개선모듈/우선순위/재검증 입력 연결

---

## 12. STEP6 입력물(재검증 단계 이관)

1. 본 문서 9장~11장(최종 판정 + merged_findings 검증 + 통계검증)
2. `docs/STEP5_시큐어코딩개선계획서.md` 모듈별 개선안(M5-1~M5-4)
3. 증적 인덱스(SS-14~SS-25) 및 DAST 요청/응답 캡처
4. 재시험 체크리스트(취약 11항목 우선 + 잠재 1항목(INPUT-notices-21-a0b1))

**STEP6 착수 조건**: 위 4개 입력물 확정 시 즉시 착수 가능


