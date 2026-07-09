<?php

    // ログインチェック
    session_start();
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $isLocalPreview = preg_match('/^(localhost|127\.0\.0\.1|\[::1\]|::1)(:\d+)?$/', $host) === 1;

    if(!$isLocalPreview && !isset($_SESSION['kengen'])){
        header("Location:../../../login.php");
        exit;
    }

?>
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="中国出身の敬涵博（ケイ）の自己紹介ページ。学習経験、強み、趣味を紹介します。"
    />
    <title>敬涵博（ケイ） | 自己紹介</title>
    <link rel="stylesheet" href="css/style.css?v=intro-neon-20260709-1" />
    <script defer src="js/vendor/three.min.js?v=intro-neon-20260709-1"></script>
    <script defer src="js/rain-scene.js?v=intro-neon-20260709-1"></script>
    <script defer src="js/vendor/gsap.min.js?v=intro-neon-20260709-1"></script>
    <script
      defer
      src="js/vendor/ScrollTrigger.min.js?v=intro-neon-20260709-1"
    ></script>
    <script defer src="js/script.js?v=intro-neon-20260709-1"></script>
    <script type="module" src="js/rain-glass.js?v=intro-neon-20260709-1"></script>
  </head>
  <body>
    <div class="background-system" aria-hidden="true">
      <div class="rain-webgl" data-rain-scene></div>
      <div class="rain-atmosphere"></div>
      <div class="grid-layer"></div>
      <div class="scan-layer"></div>
      <div class="lightning-flash" data-lightning-flash></div>
    </div>
    <div class="cyber-glitch" data-cyber-glitch aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
    <div class="intro-sequence" data-intro>
      <div class="intro-veil" data-intro-veil aria-hidden="true"></div>
      <button class="intro-skip" type="button" data-intro-skip aria-label="オープニングをスキップ">
        SKIP
      </button>
      <div class="intro-core" data-intro-core aria-hidden="true">
        <p class="intro-kicker" data-intro-kicker>SELF INTRODUCTION</p>
        <p class="intro-name" data-intro-name><span class="intro-char" data-intro-char>敬</span><span class="intro-char" data-intro-char>涵</span><span class="intro-char" data-intro-char>博</span></p>
        <span class="intro-rule" data-intro-rule></span>
        <p class="intro-sub" data-intro-sub>KEI / ENGINEER IN TRAINING</p>
      </div>
    </div>

    <header class="site-header" data-animate="header">
      <button class="brand" type="button" data-scene-focus-toggle aria-label="3Dシーン表示を切り替え" aria-pressed="false">Kei</button>
      <nav class="site-nav" aria-label="ページ内ナビゲーション">
        <a href="#top">TOP</a>
        <a href="#profile">プロフィール</a>
        <a href="#hobby">好きなもの</a>
        <a href="#career">経歴</a>
        <a href="https://souken-sys-intra.com/introduction/shinjin/2026/2026.php">2026年度</a>
        <a href="https://souken-sys-intra.com/AMS/shinjin.php">年度別一覧</a>
      </nav>
      <button
        class="sound-toggle"
        type="button"
        data-sound-toggle
        aria-pressed="false"
        aria-label="雨音・雷鳴・ネオンのノイズ音を再生"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
          <path d="M4 9v6h4l5 5V4L8 9H4z" fill="currentColor" />
          <path
            class="sound-toggle-wave"
            d="M16.3 8.5a5 5 0 0 1 0 7"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
          />
          <path
            class="sound-toggle-wave"
            d="M18.8 6a9 9 0 0 1 0 12"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
          />
          <path
            class="sound-toggle-mute"
            d="M16 8l5 8M21 8l-5 8"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </header>

    <main id="top">
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-copy" data-hero-copy>
          <p class="eyebrow">Self Introduction</p>
          <h1 id="hero-title">敬涵博 <span>ケイ</span></h1>
          <p class="hero-lead">
            中国から日本に来て、学び続けながらITエンジニアとして成長していく新人です。
          </p>
          <div class="hero-meta" aria-label="基本情報">
            <span>中国出身</span>
            <span>新人ITエンジニア</span>
            <span>Java / SQL 学習中</span>
          </div>
        </div>

        <div class="hero-stage" aria-hidden="true" data-hero-stage>
          <div class="precision-frame">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div class="stage-core" data-stage-core>
            <div class="glass-plate plate-back" data-layer="back">
              <span>Learning</span>
            </div>
            <div class="glass-plate plate-middle" data-layer="middle">
              <span>Culture</span>
            </div>
            <div class="glass-plate plate-front" data-layer="front">
              <strong>敬</strong>
              <span>Engineer</span>
            </div>
          </div>
          <!-- <div class="stage-readout">
            <span>Adaptation</span>
            <span>Responsibility</span>
            <span>Growth</span>
          </div> -->
        </div>
      </section>

      <section class="story" aria-label="自己紹介ストーリー">
        <div class="story-pin">
          <aside class="showcase" aria-hidden="true">
            <div class="showcase-label">Kei / Development Trajectory</div>
            <div class="showcase-grid">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div class="showcase-device" data-device>
              <div class="device-face device-face-front">
                <div class="device-screen">
                  <img class="device-photo" data-device-photo-front src="img/profile1.jpg" alt="" onerror="this.hidden=true" />
                  <div class="device-line line-one"></div>
                  <div class="device-line line-two"></div>
                  <div class="device-line line-three"></div>
                  <div class="device-axis"></div>
                  <div class="device-chip" data-device-chip-front>01</div>
                  <div class="device-word" data-device-word-front>Profile</div>
                </div>
              </div>
              <div class="device-face device-face-back">
                <div class="device-screen">
                  <img class="device-photo" data-device-photo-back src="img/profile2.jpg" alt="" onerror="this.hidden=true" />
                  <div class="device-line line-one"></div>
                  <div class="device-line line-two"></div>
                  <div class="device-line line-three"></div>
                  <div class="device-axis"></div>
                  <div class="device-chip" data-device-chip-back>02</div>
                  <div class="device-word" data-device-word-back>Hobby</div>
                </div>
              </div>
            </div>
            <!-- <div class="showcase-metrics">
              <span data-metric="01">Profile</span>
              <span data-metric="02">Skills</span>
              <span data-metric="03">Goal</span>
            </div> -->
          </aside>

          <div class="story-panels">
            <article id="profile" class="story-panel" data-panel="profile" data-word="Profile">
              <p class="section-kicker">Profile</p>
              <h2>プロフィール</h2>
              <div class="page-stack" data-page-stack>
                <div class="story-page" data-page data-word="Profile" data-image="img/profile1.jpg">
                  <p class="page-number">01 / 03</p>
                  <div class="body-copy">
                    <p>
                      中国出身のケイです。日本で情報処理を学びながら、ITエンジニアとして成長するために毎日少しずつ積み重ねています。
                    </p>
                    <p>
                      新しい環境でも焦らず、まず理解し、次に行動することを大切にしています。
                    </p>
                  </div>
                </div>
                <div class="story-page" data-page data-word="Profile" data-image="img/profile2.jpg">
                  <p class="page-number">02 / 03</p>
                  <div class="body-copy">
                    <p>
                      現在はJava、SQL、Spring Boot、Gitなどを中心に学習しています。基礎を固めながら、実際の開発の流れも身につけたいです。
                    </p>
                    <p>
                      分からないことをそのままにせず、調べて、試して、説明できる状態にすることを意識しています。
                    </p>
                  </div>
                </div>
                <div class="story-page" data-page data-word="Profile" data-image="img/profile3.jpg">
                  <p class="page-number">03 / 03</p>
                  <div class="body-copy">
                    <p>
                      私の強みは、継続して学ぶ姿勢と、周囲と落ち着いてコミュニケーションを取れることです。
                    </p>
                    <p>
                      チームの一員として信頼されるよう、丁寧な確認と責任感を持って仕事に向き合います。
                    </p>
                  </div>
                </div>
              </div>
             
            </article>

            <article id="career" class="story-panel" data-panel="career" data-word="Career">
              <p class="section-kicker">Career</p>
              
              <h2>経歴</h2>
              <div class="page-stack" data-page-stack>
                <div class="story-page" data-page data-word="Career" data-image="img/school1.jpg">
                  <p class="page-number">01 / 03</p>
                  <div class="body-copy">
                    <p>
                      中国では製薬の専門学校で学びました。ただ正直なところ製薬にはあまり興味を持てず、「エルデンリング」や「ゼルダの伝説」などのゲームに夢中な学生でした。
                    </p>
                    <p>
                      卒業後は約1年間日本語を勉強してから、来日しました。
                    </p>
                  </div>
                </div>
                <div class="story-page" data-page data-word="Career" data-image="img/school2.jpg">
                  <p class="page-number">02 / 03</p>
                  <div class="body-copy">
                    <p>
                      来日後は、千葉県の双葉外語学校で9か月間日本語を学びました。
                    </p>
                    <p>
                      この期間は日本語の小説を読んだり、友人とよく東京へ散歩に出かけたりしながら、日本語と日本での生活に少しずつ慣れていきました。
                    </p>
                  </div>
                </div>
                <div class="story-page" data-page data-word="Career" data-image="img/school3.jpg">
                  <p class="page-number">03 / 03</p>
                  <div class="body-copy">
                    <p>
                      その後、東京・蒲田の日本工学院専門学校に入学し、情報処理を学び始めました。1年目はドン・キホーテでアルバイトもしていました。
                    </p>
                    <p>
                      2年目からはプログラミングの学習に集中し、授業のない時間はほぼ学校で自習して、1日6〜8時間ほど勉強しました。いちばん力を入れて学んだ言語はJavaScriptです。
                    </p>
                  </div>
                </div>
              </div>
            
            </article>

            <article id="hobby" class="story-panel" data-panel="hobby" data-word="Hobby">
            
              <p class="section-kicker">Hobby</p>
              <h2>好きなもの</h2>
              <div class="page-stack" data-page-stack>
                <div class="story-page" data-page data-word="Hobby" data-image="img/food1.jpg">
                  <p class="page-number">01 / 03</p>
                  <div class="body-copy">
                    <p>
                      料理が好きです。作る前に材料や手順を整理して、完成までの流れを考える時間も楽しんでいます。
                    </p>
                    <p>
                      特に北京ダックのように準備から完成まで手間がかかる料理に魅力を感じます。
                    </p>
                  </div>
                </div>
                <div class="story-page" data-page data-word="Hobby" data-image="img/food2.jpg">
                  <p class="page-number">02 / 03</p>
                  <div class="body-copy">
                    <p>
                      Jazz、映画、ゲームも好きです。気分を切り替えたり、物語や音から新しい発想をもらったりしています。
                    </p>
                    <p>
                      好きなものに触れる時間は、集中力を戻すための大切な時間です。
                    </p>
                  </div>
                </div>
                <div class="story-page" data-page data-word="Hobby" data-image="img/food3.jpg">
                  <p class="page-number">03 / 03</p>
                  <div class="body-copy">
                    <p>
                      筋トレやAI関連の情報を見ることも日常の一部です。少しずつ変化を感じられるものに興味があります。
                    </p>
                    <p>
                      趣味でも仕事でも、継続して試しながら成長する姿勢を大切にしています。
                    </p>
                  </div>
                </div>
              </div>
              <div class="body-copy">
                <p>
                  仕事以外では、料理、Jazz、映画、ゲーム、筋トレ、AI関連の情報を見ることが好きです。
                  特に料理は、人と交流するきっかけにもなる大切な趣味です。
                </p>
                <p>
                  北京ダックのように時間をかけて作る料理にも興味があり、
                  準備から完成までの過程を楽しんでいます。
                </p>
              </div>
            </article>

           
          </div>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <p>Kei / Self Introduction</p>
    </footer>
  </body>
</html>
