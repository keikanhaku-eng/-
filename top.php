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
      content="中国出身の敬涵博（ケイ）の自己紹介ページ。学習経験、資格、強み、趣味、今後の目標を紹介します。"
    />
    <title>敬涵博（ケイ） | 自己紹介</title>
    <link rel="stylesheet" href="css/style.css?v=hero-stage-20260703-3" />
    <script defer src="https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js"></script>
    <script defer src="js/rain-scene.js?v=rain-scene-20260703-9"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
    <script
      defer
      src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"
    ></script>
    <script defer src="js/script.js"></script>
  </head>
  <body>
    <div class="background-system" aria-hidden="true">
      <div class="rain-webgl" data-rain-scene></div>
      <div class="rain-atmosphere"></div>
      <div class="grid-layer"></div>
      <div class="scan-layer"></div>
    </div>
    <div class="cyber-glitch" data-cyber-glitch aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>

    <header class="site-header" data-animate="header">
      <a class="brand" href="#top" aria-label="ページ上部へ">Kei</a>
      <nav class="site-nav" aria-label="ページ内ナビゲーション">
        <a href="#top">TOP</a>
        <a href="#profile">プロフィール</a>
        <a href="#hobby">好きなもの</a>
        <a href="#career">経歴</a>
        <a href="https://souken-sys-intra.com/introduction/shinjin/2026/2026.php">2026年度</a>
        <a href="https://souken-sys-intra.com/AMS/shinjin.php">年度別一覧</a>
      </nav>
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
                  <img class="device-photo" data-device-photo-front src="img/test1.png" alt="" onerror="this.hidden=true" />
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
                  <img class="device-photo" data-device-photo-back src="img/test2.png" alt="" onerror="this.hidden=true" />
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
                <div class="story-page" data-page data-word="Profile" data-image="img/test1.png">
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
                <div class="story-page" data-page data-word="Profile" data-image="img/test1.png">
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
                <div class="story-page" data-page data-word="Profile" data-image="img/test1.png">
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
              <div class="body-copy">
                <p>
                  中国出身の敬涵博（ケイ）です。日本で情報処理を学び、ITパスポート、
                  ビジネス能力検定3級、基本情報技術者などの資格を取得しました。
                </p>
                <p>
                  現在は新人ITエンジニアとして、JavaやSQL、開発の流れを着実に学びながら、
                  早くチームに貢献できるよう努力しています。
                </p>
              </div>
            </article>

            <article id="career" class="story-panel" data-panel="career" data-word="Career">
              <p class="section-kicker">Career</p>
              
              <h2>経歴</h2>
              <div class="page-stack" data-page-stack>
                <div class="story-page" data-page data-word="Career" data-image="img/test3.png">
                  <p class="page-number">01 / 03</p>
                  <div class="body-copy">
                    <p>
                      来日後、専門学校で情報処理を学びました。授業だけではなく、生活や人との関わり方も含めて新しい環境に適応してきました。
                    </p>
                    <p>
                      その経験から、状況を理解してから行動することの大切さを学びました。
                    </p>
                  </div>
                </div>
                <div class="story-page" data-page data-word="Career" data-image="img/test3.png">
                  <p class="page-number">02 / 03</p>
                  <div class="body-copy">
                    <p>
                      ITパスポート、ビジネス能力検定、基本情報技術者などの学習を通して、ITの基礎と仕事に必要な考え方を身につけています。
                    </p>
                    <p>
                      今は開発現場で使う知識を、実装と復習を繰り返しながら深めています。
                    </p>
                  </div>
                </div>
                <div class="story-page" data-page data-word="Career" data-image="img/test3.png">
                  <p class="page-number">03 / 03</p>
                  <div class="body-copy">
                    <p>
                      まずはチームのルールを早く理解し、安定して任せてもらえるエンジニアになることが目標です。
                    </p>
                    <p>
                      将来的にはAIなどの新しい技術も活用し、業務改善に貢献できる人材を目指します。
                    </p>
                  </div>
                </div>
              </div>
              <div class="body-copy">
                <p>
                  来日後、専門学校で情報処理を学びました。学習だけでなく、
                  生活や人との関わり方も含めて、新しい環境に一つずつ適応してきました。
                </p>
                <p>
                  その経験を通して、状況を理解してから行動すること、責任を持って取り組むこと、
                  そして継続して学ぶことの大切さを実感しました。
                </p>
              </div>
            </article>

            <article id="skills" class="story-panel" data-panel="skills" hidden>
              
              <h2>資格と現在学んでいる技術</h2>
              <div class="tag-grid" aria-label="資格と技術一覧">
                <span>ITパスポート</span>
                <span>ビジネス能力検定 3級</span>
                <span>基本情報技術者</span>
                <span>Java</span>
                <span>Spring Boot</span>
                <span>Git</span>
                <span>MySQL / SQL</span>
                <span>AI活用</span>
              </div>
            </article>

            <article id="strengths" class="story-panel" data-panel="strengths" hidden>
              
              <h2>仕事で活かしたい強み</h2>
              <div class="card-grid">
                <section class="info-card">
                  <span class="card-number">01</span>
                  <h3>継続して学ぶ姿勢</h3>
                  <p>基礎を大切にしながら、分からないことを一つずつ確認します。</p>
                </section>
                <section class="info-card">
                  <span class="card-number">02</span>
                  <h3>異文化での対話</h3>
                  <p>相手の立場や背景を理解しながら、落ち着いてコミュニケーションします。</p>
                </section>
                <section class="info-card">
                  <span class="card-number">03</span>
                  <h3>責任感と主体性</h3>
                  <p>任されたことに丁寧に向き合い、状況を整理して行動します。</p>
                </section>
              </div>
            </article>

            <article id="hobby" class="story-panel" data-panel="hobby" data-word="Hobby">
            
              <p class="section-kicker">Hobby</p>
              <h2>好きなもの</h2>
              <div class="page-stack" data-page-stack>
                <div class="story-page" data-page data-word="Hobby" data-image="img/test2.png">
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
                <div class="story-page" data-page data-word="Hobby" data-image="img/test2.png">
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
                <div class="story-page" data-page data-word="Hobby" data-image="img/test2.png">
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

            <article id="goal" class="story-panel" data-panel="goal" hidden>
            
              <h2>今後の目標</h2>
              <div class="body-copy">
                <p>
                  まずはJavaやSQL、業務知識、会社の開発ルールを着実に身につけ、
                  チームに安定して貢献できるエンジニアになることを目標にしています。
                </p>
                <p>
                  将来的には、AIなどの新しい技術も活用しながら、技術面だけでなく、
                  チームや業務にも貢献できる人材を目指したいです。
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
