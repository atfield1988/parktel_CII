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

## 3. STEP6 베이스라인 재검증 결과(현재 코드 기준)

### 3.1 정적 코드 재검증(핵심 패턴)

다음 취약 패턴이 현재 코드에 그대로 존재함을 재확인:

- `backend/app/init_db.py:17` → `kspo88!`
- `backend/app/init_db.py:32` → `banquet88!`
- `backend/app/routers/auth.py:22` → `abcd1234`
- `backend/app/routers/admin.py:65` → `banquet88!`
- `backend/app/security.py:8` → `default_secret_key_for_dev`
- `backend/app/main.py:24` → `allow_methods=["*"]`
- `backend/app/main.py:18` → `ALLOWED_ORIGINS` 기본 `*`

자동화 공격 통제(rate limit/lockout/captcha) 관련 구현은 인증 라우터 기준 유의미한 보안 통제 로직을 확인하지 못함.

### 3.2 운영 엔드포인트 재검증(DAST 기초 확인)

- `/docs` → HTTP 200
- `/redoc` → HTTP 200
- `/openapi.json` → HTTP 200
- `/` → HTTP 200
- 루트 응답 헤더에서 CSP/HSTS/X-Frame-Options/X-Content-Type-Options/Referrer-Policy 확인 불가

---

## 4. TC-01 ~ TC-08 수행 결과(현 시점)

| TC | 항목 | 기대 결과(개선 후) | 현재 결과 | 판정 |
|---|---|---|---|---|
| TC-01 | BF | 하드코딩 비밀번호 제거 | 하드코딩 문자열 잔존 | 미통과 |
| TC-02 | IS | SECRET_KEY 폴백 제거 + 토큰 무효화 | SECRET_KEY 폴백 잔존(토큰 무효화 미확정) | 미통과 |
| TC-03 | IN/IL | `schedule-approved` 접근권한 강화/PII 마스킹 | 기존 권한/노출 구조 개선 확인 필요(미적용 기준 취약 유지) | 미통과 |
| TC-04 | EP | 내부 예외문구 비노출 | STEP4 취약 근거 유지(개선 미반영) | 미통과 |
| TC-05 | AU/IA | 로그인 반복요청 통제 적용 | rate limit/lockout/captcha 미확인 | 미통과 |
| TC-06 | CF/WM | CSRF 동등통제 + 허용메소드 최소화 | allow_methods 전체 허용 유지 | 미통과 |
| TC-07 | SN/AE | docs/redoc/openapi 차단 + 보안헤더 적용 | 문서 노출/헤더 미설정 지속 | 미통과 |
| TC-08 | XS(잠재) | notices 입력/출력 회귀검증 통과 | 기존 양호/예방개선 권고 상태 유지 | 조건부 통과 |

---

## 5. 최종 판정(현 시점, 개선 미적용 베이스라인)

- 양호: 5개 (CI, SI, DI, XS, PV)
- 취약: 11개 (EP, IL, CF, BF, IA, IN, IS, SN, AE, AU, WM)
- N/A: 5개 (SF, PR, FU, FD, CC)

> 결론: STEP6는 착수되었으며, **현재 기준은 개선 전 베이스라인 재검증 단계**로 확인됨.
> 실제 개선 코드 반영 후 동일 TC 재실행이 필요함.

---

## 6. 다음 실행 단계(즉시 진행 항목)

1. **M5-1 우선 적용**: BF/IS(하드코딩 비밀번호 제거, SECRET_KEY 폴백 제거, 토큰 무효화)
2. **M5-2 적용**: IN/IL/EP/AE(권한검증 강화, PII 최소화, 오류응답 표준화, 문서노출 차단)
3. **M5-3 적용**: CF/AU/WM(CSRF 동등통제, 로그인 속도제한, 메소드 최소화)
4. **M5-4 적용**: SN(HTTPS 강제 및 보안헤더 적용)
5. 적용 완료 후 STEP6 TC-01~08 재실행 및 판정 재확정

---

## 7. 증적 참조

- 코드 근거: `backend/app/init_db.py`, `backend/app/routers/auth.py`, `backend/app/routers/admin.py`, `backend/app/security.py`, `backend/app/main.py`
- 운영 근거: `https://parktel-backend.onrender.com/docs`, `/redoc`, `/openapi.json`, `/`
- 증적 이미지: `docs/assets/SS-01` ~ `SS-05`
