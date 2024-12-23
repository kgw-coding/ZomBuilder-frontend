"use client";

import React, { useState, useEffect } from "react";
import Modal from "../Modal_Recommend/Modal";
import Image from 'next/image'; // next/image에서 Image를 임포트
import Link from 'next/link';
import styles from "../../../styles/recommend_builder/recommend.module.css";

// 직업 데이터 타입 정의
type Job = {
  id: number;
  name: string;
  description: string;
  point: number;
  effect: string;
  active_trait: string;
  image: string;
  mode: string;
};

// Trait 데이터 타입 정의
type Trait = {
  id: number;
  group: string;
  trait_name: string;
  description: string;
  effect: string;
  points: number;
  disabled_traits: string;
  disabled_jobs: string;
  mode: string;
  image: string;
};

// 게시글 데이터 타입 정의
type Post = {
  id: number;
  job_id: number;
  trait_id: string;
  comment: string;
  password: string;
  created_at: string;
  modecheck: string;
};

const RecommendBuilder: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]); // 직업 데이터 상태
  const [positiveTraits, setPositiveTraits] = useState<Trait[]>([]); // 긍정 특성 상태
  const [negativeTraits, setNegativeTraits] = useState<Trait[]>([]); // 부정 특성 상태
  const [currentMode, setCurrentMode] = useState<string>("X"); // 현재 모드
  const [posts, setPosts] = useState<Post[]>([]); // 게시글 데이터 상태
  const [hoveredDescription, setHoveredDescription] = useState<string | null>(null); // 현재 설명
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 }); // 설명 위치
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]); // 필터링된 게시글
  const [searchText, setSearchText] = useState<string>(""); // 검색 텍스트 상태 추가
  const [job_traitsSearchText, setjob_traitsSearchText] = useState<string>("");
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null); // 선택한 직업 ID
  const [selectedTraitIds, setSelectedTraitIds] = useState<number[]>([]); // 선택한 특성 ID
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 
  const [modalData, setModalData] = useState<{ id: number; jobId: number; traitIds: string; } | null>(null); // 모달
  const [isBlocked, setIsBlocked] = useState(false);

  const [youtubeTitleTop, setYoutubeTitleTop] = useState("한국인이 좋아하는 속도 프로젝트 좀보이드 공략");
  const [youtubeTitleBottom, setYoutubeTitleBottom] = useState("영상 하나로 끝내는 프로젝트 좀보이드 공략");
  const [youtubeVideoUrlTop, setYoutubeVideoUrlTop] = useState("https://www.youtube.com/watch?v=0Xa360FLirY");
  const [youtubeVideoUrlBottom, setYoutubeVideoUrlBottom] = useState("https://www.youtube.com/watch?v=q9cyYL8P9O0&t=355s");

  // 직업 데이터를 API에서 가져오기
  const fetchJobs = async (mode: string) => {
    try {
      const response = await fetch(`https://server.zombuilder.com/api/jobs?mode=${mode}`);
      const data = await response.json();
      if (data.success) {
        setJobs(data.data);
      } else {
        console.error("Error fetching job data:", data.message);
      }
    } catch (error) {
      console.error("Error fetching job data:", error);
    }
  };

  // 특성 데이터를 API에서 가져오기
  const fetchTraits = async (mode: string) => {
    try {
      const positiveUrl =
        mode === "X"
          ? "https://server.zombuilder.com/api/vTraits?group=positive"
          : "https://server.zombuilder.com/api/mTraits?group=positive";
      const negativeUrl =
        mode === "X"
          ? "https://server.zombuilder.com/api/vTraits?group=negative"
          : "https://server.zombuilder.com/api/mTraits?group=negative";

      const [positiveResponse, negativeResponse] = await Promise.all([
        fetch(positiveUrl),
        fetch(negativeUrl),
      ]);

      const positiveData = await positiveResponse.json();
      const negativeData = await negativeResponse.json();

      if (positiveData.success) setPositiveTraits(positiveData.data);
      if (negativeData.success) setNegativeTraits(negativeData.data);
    } catch (error) {
      console.error("Error fetching traits data:", error);
    }
  };

  // 게시글 데이터를 API에서 가져오기
  const fetchPosts = async () => {
    try {
      const response = await fetch("https://server.zombuilder.com/post/rPosts");
      const data = await response.json();
      if (data.success) {
        // 전체 게시글 저장
        setPosts(data.data);
      } else {
        console.error("Error fetching posts:", data.message);
      }
    } catch (error) {
      console.error("Error fetching posts data:", error);
    }
  };

  // 직업, 특성, 검색으로 인한 게시글 필터링
  const filterPosts = () => {
    const filtered = posts
      .filter((post) => post.modecheck === currentMode) // 현재 모드에 맞는 게시글만 필터링
      .filter((post) => {
        const traitIds = post.trait_id.split(",").map(Number);
        const hasJob = selectedJobId === null || post.job_id === selectedJobId;
        const hasTrait = selectedTraitIds.every((id) => traitIds.includes(id));
        const matchesSearch = post.comment.toLowerCase().includes(searchText.toLowerCase());
        return hasJob && hasTrait && matchesSearch;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // 최신순 정렬
      .slice(0, 6); // 상위 6개만 가져오기
  
    setFilteredPosts(filtered);
  };

  // 직업 선택 핸들러
  const handleJobSelect = (jobId: number) => {
    setSelectedJobId((prev) => (prev === jobId ? null : jobId)); // 동일 클릭 시 선택 해제
  };

  // 특성 선택 핸들러
  const handleTraitSelect = (traitId: number) => {
    setSelectedTraitIds((prev) =>
      prev.includes(traitId) ? prev.filter((id) => id !== traitId) : [...prev, traitId]
    );
  };

  // 모드 변경 시 데이터를 다시 가져옴
  const handleModeChange = (mode: string) => {
    setCurrentMode(mode);
    fetchJobs(mode);
    fetchTraits(mode);
    setSelectedJobId(null);
    setSelectedTraitIds([]);
    setSearchText(""); // 검색어 초기화
  };

  // 기본 모드 데이터 로드
  useEffect(() => {
    fetchJobs("X"); // 직업 초기는 값은 바닐라
    fetchTraits("X"); // 특성 초기는 값은 바닐라
    fetchPosts(); // 게시글 데이터 로드
  }, []);

  // 필터링 업데이트
  useEffect(() => {
    filterPosts();
  }, [selectedJobId, selectedTraitIds, posts, searchText, currentMode]);

  // 설명 툴팁 설정
  const handleMouseEnter = (description: string, event: React.MouseEvent) => {
    setHoveredDescription(description);
    setTooltipPosition({ x: event.clientX + 10, y: event.clientY + 10 }); // 마우스 위치 기준
  };

  // 설명 툴팁 숨기기
  const handleMouseLeave = () => {
    setHoveredDescription(null);
  };

  const handleSearchClick = () => {
    if (!job_traitsSearchText.trim()) {
      alert("검색어를 입력하세요."); // 검색어 미입력 시 알림
      return;
    }

    // 직업 검색
    const matchingJob = jobs.find(
      (job) => job.name.toLowerCase() === job_traitsSearchText.toLowerCase()
    );
    if (matchingJob) {
      handleJobSelect(matchingJob.id); // 직업 선택
    }

    // 특성 검색
    const matchingTrait =
      positiveTraits.find(
        (trait) =>
          trait.trait_name.toLowerCase() === job_traitsSearchText.toLowerCase()
      ) ||
      negativeTraits.find(
        (trait) =>
          trait.trait_name.toLowerCase() === job_traitsSearchText.toLowerCase()
      );

    if (matchingTrait) {
      handleTraitSelect(matchingTrait.id); // 특성 선택
    }

    if (!matchingJob && !matchingTrait) {
      alert("일치하는 직업 또는 특성을 찾을 수 없습니다.");
    }

    setjob_traitsSearchText(""); // 검색창 초기화
  };

  // 직업 이름 찾는 헬퍼 함수 추가
  const getJobNameById = (jobId: number): string => {
    const job = jobs.find((job) => job.id === jobId);
    return job ? job.name : "직업 없음"; // 직업이 없을 경우
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      event.key === "Enter" &&
      !isBlocked &&
      event.nativeEvent.isComposing === false
    ) {
      if (!job_traitsSearchText.trim()) {
        alert("검색어를 입력하세요."); // 검색어 미입력 시 알림
        return;
      }

      setIsBlocked(true); // 입력 차단 활성화
      handleSearchClick();

      setTimeout(() => {
        setIsBlocked(false); // 500ms 후 차단 해제
      }, 500);
    }
  };

  // 모달
  const openModal = (post: Post) => {
    setModalData({
      id: post.id,
      jobId: post.job_id,
      traitIds: post.trait_id,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalData(null);
  };

  // 유튜브 URL에서 ID 추출 함수
  const extractVideoId = (url: string) => {
    const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    return match ? match[1] : null;
  };

  const videoIdTop = extractVideoId(youtubeVideoUrlTop);
  const videoIdBottom = extractVideoId(youtubeVideoUrlBottom);

  return (
    <div className={styles.recommendpage}>
      <div className={styles.mainHeader}>
        {/* 좌측 상단 좀빌더 로고 */}
        <div className={styles.zomBuilderLogo}>
          <Link href="/">
            <Image
              src="/image/zomboid-logo.png" // 절대 경로 사용
              alt="좀빌더 로고"
              layout="intrinsic"
              width={250}
              height={100}
              style={{ cursor: "pointer" }}
            />
          </Link>
        </div>

        {/* 우측 상단 인디스톤 로고 */}
        <div className={styles.indieStoneLogo}>
          <Link href="https://projectzomboid.com/blog/about-us/"
            target="_blank"
            rel="noopener noreferrer">
            <Image
              src="/image/logo.png"
              alt="인디스톤 로고"
              layout="intrinsic"
              width={100}
              height={100}
              style={{ cursor: "pointer" }}
            />
          </Link>
        </div>
      </div>

      {/* 메뉴바 설정부분 */}
      <div className={styles.underHeader}>
        <div className={styles.menuTitle}>
          <img src="../image/menuLogo.png" alt="menu" className={styles.menuLogo} />
          <h1>Recommend Builder</h1>
        </div>
        <div className={styles.searchInputGroup}>
          <input
            type="text"
            placeholder="직업 또는 특성 이름을 입력하세요"
            className={styles.searchInput}
            value={job_traitsSearchText} // 입력 상태와 연결
            onChange={(e) => setjob_traitsSearchText(e.target.value)} // 상태 업데이트
            onKeyDown={handleKeyDown} // onKeyDown 이벤트 연결
          />
          <button
            className={styles.searchButton}
            onClick={handleSearchClick} // 버튼 클릭 시 실행
          >
            <img
              src="../image/searchIcon.png"
              alt="search"
              className={styles.searchInputIcon}
            />
          </button>
        </div>
      </div>

      {/* 모드 선택창부분 */}
      <div className={styles.modePick}>
        <h3>Mode Pick</h3>
        <div className={styles.modeButtonGroup}>
          <button className={`${styles.modeButton} ${currentMode === "X" ? styles.selected : ""}`}
            onClick={() => handleModeChange("X")}
          >
            <img src="../image/modeLogo1.png" alt="modeLogo" className={styles.modeLogo} />Vanilla
          </button>
          <button className={`${styles.modeButton} ${currentMode === "O" ? styles.selected : ""}`}
            onClick={() => handleModeChange("O")}
          >
            <img src="../image/modeLogo2.png" alt="modeLogo" className={styles.modeLogo} />More Simple Traits (MST) & Simple Overhaul Traits and Occupations (SOTO)
          </button>
        </div>
      </div>

      {/* 직업 선택창부분 */}
      <div className={styles.jobPick}>
        {jobs.map((job) => (
          <button
            key={job.id}
            className={`${styles.jobButton} ${selectedJobId === job.id ? styles.selected : ""
              }`}
            onClick={() => handleJobSelect(job.id)}
          >
            {job.image && (
              <img src={`../image/job/${job.image}`} alt={job.name} className={styles.jobImage} />
            )}
            <span className={styles.jobName}>{job.name}</span>
          </button>
        ))}
      </div>

      {/* 추천빌드 검색창 */}
      <div className={styles.searchContainer}>
        <img src="../image/searchIcon.png" alt="Search Icon" className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search for a Build"
          className={styles.searchBuildInput}
          value={searchText} // 입력 값을 상태와 연결
          onChange={(e) => setSearchText(e.target.value)} // 상태 업데이트
        />
      </div>


      <div className={styles.gridMain}>
        <h2 className={styles.youtuberTitle}>유튜브 인기 추천 빌드</h2>
        <h2 className={styles.positiveTitle}>긍정 특성 선택</h2>
        <h2 className={styles.negativeTitle}>부정 특성 선택</h2>

        {/* 유튜버 추천 빌드 */}
        <div className={styles.youtubeRecommendationTop}>
          <img src="../image/youtubeLogo.png" alt="youtubeLogo" className={styles.youtubeLogo} />
          <h3>{youtubeTitleTop}</h3>
          <h4 className={styles.youtuberBuildVersion}>Build 41.78.16</h4>
          <h4 className={styles.youtuberPick}>Youtuber Pick</h4>
          <h4 className={styles.youtuberJob}>스피드런</h4>
          <div className={styles.youtubeContent}>
            {videoIdTop ? (
              <iframe
                src={`https://www.youtube.com/embed/${videoIdTop}`}
                title={youtubeTitleTop}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <p>Invalid YouTube URL</p>
            )}
          </div>
        </div>
        <div className={styles.youtubeRecommendationBottom}>
          <img src="../image/youtubeLogo.png" alt="youtubeLogo" className={styles.youtubeLogo} />
          <h3>{youtubeTitleBottom}</h3>
          <h4 className={styles.youtuberBuildVersion}>41.78.16</h4>
          <h4 className={styles.youtuberPick}>Youtuber Pick</h4>
          <h4 className={styles.youtuberJob}>공략</h4>
          <div className={styles.youtubeContent}>
            {videoIdBottom ? (
              <iframe
                src={`https://www.youtube.com/embed/${videoIdBottom}`}
                title={youtubeTitleBottom}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <p>Invalid YouTube URL</p>
            )}
          </div>
        </div>

        {/* 긍정 특성 */}
        <div className={styles.positiveTraits}>
          <ul className={styles.traitsList}>
            {positiveTraits.map((trait) => (
              <li
                key={trait.id}
                className={`${styles.trait} ${selectedTraitIds.includes(trait.id) ? styles.selected : ""
                  }`}
                onClick={() => handleTraitSelect(trait.id)}
              >
                <img src={`../image/trait/${trait.image}`} alt={trait.trait_name} className={styles.traitIcon} />
                <span className={styles.traitName}>{trait.trait_name}</span>
                <span className={styles.positiveTraitPoints}>{trait.points > 0 ? `+ ${trait.points}` : `- ${Math.abs(trait.points)}`}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 부정 특성 */}
        <div className={styles.negativeTraits}>
          <ul className={styles.traitsList}>
            {negativeTraits.map((trait) => (
              <li
                key={trait.id}
                className={`${styles.trait} ${selectedTraitIds.includes(trait.id) ? styles.selected : ""
                  }`}
                onClick={() => handleTraitSelect(trait.id)}
              >
                <img
                  src={`../image/trait/${trait.image}`}
                  alt={trait.trait_name}
                  className={styles.traitIcon}
                />
                <span className={styles.traitName}>{trait.trait_name}</span>
                <span className={styles.negativeTraitPoints}>{trait.points > 0 ? `+ ${trait.points}` : `- ${Math.abs(trait.points)}`}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 게시글 표시 */}
      <div className={styles.gridBottom}>
      <div className={styles.gridTitle}><h3>유저빌드 목록</h3></div>
        {filteredPosts.map((post, index) => (
          <div
            key={post.id}
            className={styles.builderBox}
            onClick={() => openModal(post)}
          >
            <div className={styles.buildTitle}>
              - {post.comment}
            </div>
            <div className={styles.buildTag}>
              <h4 className={styles.buildVersion}>Build 41.78.16</h4>
              <h4 className={styles.job}>{getJobNameById(post.job_id)}</h4> {/* 여기서 직업 이름 표시 */}
            </div>
          </div>
        ))}
      </div>

      {/* 모달 */}
      {isModalOpen && modalData && (
        <Modal
          id={modalData.id}
          jobId={modalData.jobId}
          traitIds={modalData.traitIds}
          onClose={closeModal}
        />
      )}

      {/* 설명 툴팁 */}
      {hoveredDescription && (
        <div
          className={styles.tooltip}
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
          }}
        >
          {
            hoveredDescription
          }
        </div>
      )}
    </div>
  );
};

export default RecommendBuilder;