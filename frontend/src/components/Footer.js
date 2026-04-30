import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-menu">
        {/*... 푸터 메뉴... */}
      </div>
      <div className="bottom-info inner-container">
        {/* 
          로고가 푸터에도 있다면 여기에 img 태그 추가
          <p className="footer-logo"><img src="/images/logo_footer.png" alt="서울올림픽파크텔" /></p>
        */}
        <address>
          {/* [요구사항] H&T Service -> 서울올림픽파크텔 정보로 변경 */}
          <strong>서울올림픽파크텔</strong> (05540) 서울특별시 송파구 올림픽로 448 (방이동)<br />
          <strong>문의 및 사업장정보</strong> | 대표이사 : 하형주 | 대표전화 : 02) 410-2114<br />
          사업자등록번호 : 215-82-01873 | 통신판매신고번호 : 제2020-서울송파-0660호<br />
          <a href="#">[개인정보처리방침]</a>
          <p className="copyright">
            COPYRIGHT © 2024 Seoul Olympic Parktel. ALL RIGHT RESERVED.
          </p>
        </address>
      </div>
    </footer>
  );
};

export default Footer;