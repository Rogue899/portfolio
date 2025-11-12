import React, { useState, useEffect, useRef } from 'react';
import HTMLFlipBook from "react-pageflip";
import './PortfolioBook.css';

const PageCover = React.forwardRef((props, ref) => {
  return (
    <div className="page page-cover" ref={ref} data-density="soft">
      <div className="page-content">
        <h2>{props.children}</h2>
      </div>
    </div>
  );
});

const Page = React.forwardRef((props, ref) => {
  return (
    <div className="page" ref={ref} data-density="soft">
      <div className="page-content">
        {props.children}
      </div>
    </div>
  );
});

const PortfolioBook = ({ onClose }) => {
  const flipBook = useRef();
  const [page, setPage] = useState(0);
  const [totalPage, setTotalPage] = useState(9); // 2 covers + 7 content pages

  const onPage = (e) => {
    setPage(e.data);
  };

  const onChangeOrientation = (e) => {
    // Orientation change handler
  };

  const onChangeState = (e) => {
    // State change handler
  };

  const handleDownloadCV = () => {
    // Generate CV text content
    const cvContent = `TAREK ROUKOS
================

CONTACT INFORMATION
------------------
Phone: +961 70 514 899
Email: tarek.roukos@lau.edu
LinkedIn: https://www.linkedin.com/in/tarek-roukos-60058a9b

SKILLS
------
Engineering & Development
- Languages: JavaScript (ES6+), TypeScript, C#
- Frameworks & Libraries: React.js (Hooks, Context API, Class Components), Angular.js (v1), Angular (v12+), Material UI, Tailwind CSS, GSAP, Three.js, Redux, LocalForage, IndexedDB
- Infrastructure & APIs: RESTful APIs, GraphQL (Apollo Client), Docker, Kubernetes, Elasticsearch, WebSockets (Pusher)
- Architecture & Design Patterns: Component-based architecture, Reusable component development, Service Layer, Singleton, Mediator
- CMS & Platforms: SharePoint, Akumina, Skwid CMS (C#, MVC, View Components, Sass), Electron
- Version Control & Tools: Git (branching, merging, rebasing), NPM, PNPM, Yarn, Axios
- Databases: PostgreSQL, MySQL, SQL Server
- Operating Systems: Linux, Windows
- Agile Methodologies: SCRUM

General
- Languages: Fluent in English and Arabic, Beginner in French

EXPERIENCE
---------

Born Interactive – Beirut, Lebanon
Senior Web Developer (2025–Present)
- Lead development of enterprise-grade web solutions using SharePoint and Akumina, building custom widgets and components.
- Engineered dynamic front-end features using React (Hooks and Class Components), JavaScript, and CSS.
- Developed and maintained CMS-driven applications using Skwid (C#, MVC, View Components, Sass).
- Provided ongoing client and application support, resolving bugs and deploying system updates.
- Collaborated with cross-functional teams to ensure seamless integration between CMS platforms and SharePoint.
- Participated in code reviews, performance tuning, and legacy system modernization.
- Worked in fast-paced environments with both small agile teams and larger cross-functional groups.

SerVme – Beirut, Lebanon
Software Engineer Level 2 (2021–2025)
- Migrated legacy AngularJS codebase to React, modernizing UI/UX and improving maintainability.
- Developed and maintained dashboards and reporting tools, integrating RESTful and GraphQL APIs.
- Integrated WhatsApp Business API for automated reservation notifications and customer engagement.
- Implemented WebSockets for real-time updates, managing application state via Redux.
- Built reusable UI components (tables, pagination, layout containers) with conditional rendering logic.
- Enabled offline capabilities using LocalForage and IndexedDB for persistent client-side caching.
- Led feature estimation, PRD review, and collaborated with QA and design teams to ensure delivery quality.
- Maintained legacy systems while progressively transitioning to modern frameworks and architecture.
- Operated in high-velocity development cycles, adapting to evolving requirements and team structures.

CME – Beirut, Lebanon
Junior Software Engineer (2019–2020)
- Developed RESTful APIs using C# with EF Core (Code First), implementing secure authentication via Identity Server.
- Applied Mediator pattern and LINQ for efficient data querying and transformation.
- Built React-based portals and desktop applications (Electron), managing global state with Context API.
- Designed and implemented reusable components and feature flags for scalable development.
- Contributed to UI/UX design decisions and collaborated on portal and desktop app styling using Material UI.
- Participated in architectural decisions and design implementation discussions.

EDUCATION
---------
Lebanese American University
Bachelor's in Management Information Systems (2013–2018)
Minor in Computer Science

CERTIFICATIONS
--------------
HackerRank Problem Solving Certificate
https://www.hackerrank.com/certificates/93f72b72b7e6
`;

    // Create blob and download
    const blob = new Blob([cvContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Tarek_Roukos_CV.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    // Try to get page count after book is initialized
    const timer = setTimeout(() => {
      try {
        if (flipBook.current && typeof flipBook.current.getPageFlip === 'function') {
          const pageFlip = flipBook.current.getPageFlip();
          if (pageFlip && typeof pageFlip.getPageCount === 'function') {
            const pageCount = pageFlip.getPageCount();
            if (pageCount > 0) {
              setTotalPage(pageCount);
            }
          }
        }
      } catch (error) {
        console.log('Page count not available yet');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="portfolio-book-fullscreen">
      <button className="book-close-button" onClick={onClose}>×</button>
      <button className="book-download-button" onClick={handleDownloadCV} title="Download CV">
        ⬇️ Download CV
      </button>
      <div className="portfolio-book-container">
        <HTMLFlipBook
          width={550}
          height={733}
          size="stretch"
          minWidth={315}
          maxWidth={1000}
          minHeight={400}
          maxHeight={1533}
          maxShadowOpacity={0.5}
          showCover={false}
          mobileScrollSupport={true}
          usePortrait={true}
          flippingTime={1000}
          onFlip={onPage}
          onChangeOrientation={onChangeOrientation}
          onChangeState={onChangeState}
          className="demo-book"
          ref={flipBook}
        >
          <PageCover>Tarek Roukos</PageCover>
          
          {/* Page 1: Contact & Header */}
          <Page>
            <div className="cv-section">
              <h1 className="cv-name">Tarek Roukos</h1>
              <div className="cv-contact">
                <p><strong>Phone:</strong> +961 70 514 899</p>
                <p><strong>Email:</strong> tarek.roukos@lau.edu</p>
                <p><strong>LinkedIn:</strong> <a href="https://www.linkedin.com/in/tarek-roukos-60058a9b" target="_blank" rel="noopener noreferrer">linkedin.com/in/tarek-roukos-60058a9b</a></p>
              </div>
              
              <h2 className="cv-section-title">SKILLS</h2>
              <h3 className="cv-subsection-title">Engineering & Development</h3>
              <ul className="cv-list">
                <li><strong>Languages:</strong> JavaScript (ES6+), TypeScript, C#</li>
                <li><strong>Frameworks & Libraries:</strong> React.js (Hooks, Context API, Class Components), Angular.js (v1), Angular (v12+), Material UI, Tailwind CSS, GSAP, Three.js, Redux, LocalForage, IndexedDB</li>
              </ul>
            </div>
          </Page>

          {/* Page 2: Skills Continued */}
          <Page>
            <div className="cv-section">
              <h3 className="cv-subsection-title">Engineering & Development (continued)</h3>
              <ul className="cv-list">
                <li><strong>Infrastructure & APIs:</strong> RESTful APIs, GraphQL (Apollo Client), Docker, Kubernetes, Elasticsearch, WebSockets (Pusher)</li>
                <li><strong>Architecture & Design Patterns:</strong> Component-based architecture, Reusable component development, Service Layer, Singleton, Mediator</li>
                <li><strong>CMS & Platforms:</strong> SharePoint, Akumina, Skwid CMS (C#, MVC, View Components, Sass), Electron</li>
                <li><strong>Version Control & Tools:</strong> Git (branching, merging, rebasing), NPM, PNPM, Yarn, Axios</li>
                <li><strong>Databases:</strong> PostgreSQL, MySQL, SQL Server</li>
                <li><strong>Operating Systems:</strong> Linux, Windows</li>
                <li><strong>Agile Methodologies:</strong> SCRUM</li>
              </ul>

              <h3 className="cv-subsection-title">General</h3>
              <ul className="cv-list">
                <li><strong>Languages:</strong> Fluent in English and Arabic, Beginner in French</li>
              </ul>
            </div>
          </Page>

          {/* Page 3: Experience - Born Interactive */}
          <Page>
            <div className="cv-section">
              <h2 className="cv-section-title">EXPERIENCE</h2>
              
              <div className="cv-job">
                <div className="cv-job-header">
                  <h3 className="cv-job-title">Born Interactive – Beirut, Lebanon</h3>
                  <p className="cv-job-role">Senior Web Developer (2025–Present)</p>
                </div>
                <ul className="cv-job-duties">
                  <li>Lead development of enterprise-grade web solutions using SharePoint and Akumina, building custom widgets and components.</li>
                  <li>Engineered dynamic front-end features using React (Hooks and Class Components), JavaScript, and CSS.</li>
                  <li>Developed and maintained CMS-driven applications using Skwid (C#, MVC, View Components, Sass).</li>
                  <li>Provided ongoing client and application support, resolving bugs and deploying system updates.</li>
                  <li>Collaborated with cross-functional teams to ensure seamless integration between CMS platforms and SharePoint.</li>
                  <li>Participated in code reviews, performance tuning, and legacy system modernization.</li>
                  <li>Worked in fast-paced environments with both small agile teams and larger cross-functional groups.</li>
                </ul>
              </div>
            </div>
          </Page>

          {/* Page 4: Experience - SerVme Part 1 */}
          <Page>
            <div className="cv-section">
              <div className="cv-job">
                <div className="cv-job-header">
                  <h3 className="cv-job-title">SerVme – Beirut, Lebanon</h3>
                  <p className="cv-job-role">Software Engineer Level 2 (2021–2025)</p>
                </div>
                <ul className="cv-job-duties">
                  <li>Migrated legacy AngularJS codebase to React, modernizing UI/UX and improving maintainability.</li>
                  <li>Developed and maintained dashboards and reporting tools, integrating RESTful and GraphQL APIs.</li>
                  <li>Integrated WhatsApp Business API for automated reservation notifications and customer engagement.</li>
                  <li>Implemented WebSockets for real-time updates, managing application state via Redux.</li>
                  <li>Built reusable UI components (tables, pagination, layout containers) with conditional rendering logic.</li>
                </ul>
              </div>
            </div>
          </Page>

          {/* Page 5: Experience - SerVme Part 2 */}
          <Page>
            <div className="cv-section">
              <div className="cv-job">
                <div className="cv-job-header">
                  <h3 className="cv-job-title">SerVme – Beirut, Lebanon (continued)</h3>
                </div>
                <ul className="cv-job-duties">
                  <li>Enabled offline capabilities using LocalForage and IndexedDB for persistent client-side caching.</li>
                  <li>Led feature estimation, PRD review, and collaborated with QA and design teams to ensure delivery quality.</li>
                  <li>Maintained legacy systems while progressively transitioning to modern frameworks and architecture.</li>
                  <li>Operated in high-velocity development cycles, adapting to evolving requirements and team structures.</li>
                </ul>
              </div>
            </div>
          </Page>

          {/* Page 6: Experience - CME */}
          <Page>
            <div className="cv-section">
              <div className="cv-job">
                <div className="cv-job-header">
                  <h3 className="cv-job-title">CME – Beirut, Lebanon</h3>
                  <p className="cv-job-role">Junior Software Engineer (2019–2020)</p>
                </div>
                <ul className="cv-job-duties">
                  <li>Developed RESTful APIs using C# with EF Core (Code First), implementing secure authentication via Identity Server.</li>
                  <li>Applied Mediator pattern and LINQ for efficient data querying and transformation.</li>
                  <li>Built React-based portals and desktop applications (Electron), managing global state with Context API.</li>
                  <li>Designed and implemented reusable components and feature flags for scalable development.</li>
                  <li>Contributed to UI/UX design decisions and collaborated on portal and desktop app styling using Material UI.</li>
                  <li>Participated in architectural decisions and design implementation discussions.</li>
                </ul>
              </div>
            </div>
          </Page>

          {/* Page 7: Education & Certifications */}
          <Page>
            <div className="cv-section">
              <h2 className="cv-section-title">EDUCATION</h2>
              <div className="cv-education">
                <h3 className="cv-education-institution">Lebanese American University</h3>
                <p className="cv-education-degree">Bachelor's in Management Information Systems (2013–2018)</p>
                <p className="cv-education-minor">Minor in Computer Science</p>
              </div>

              <h2 className="cv-section-title">CERTIFICATIONS</h2>
              <div className="cv-certification">
                <p><strong>HackerRank Problem Solving Certificate:</strong> <a href="https://www.hackerrank.com/certificates/93f72b72b7e6" target="_blank" rel="noopener noreferrer">View Certificate</a></p>
              </div>
            </div>
          </Page>

          <PageCover>Thank You</PageCover>
        </HTMLFlipBook>
      </div>
    </div>
  );
};

export default PortfolioBook;

