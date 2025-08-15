/**
 * TikZ.gs - TikZ Snippets Management (FROM PASTE.TXT)
 * Quản lý các snippet TikZ cho việc tạo hình vẽ trong câu hỏi
 */

// ===== 📚 SNIPPET LIBRARY - EXACT FROM PASTE.TXT =====

/**
 * Snippet đầy đủ cho hình học phẳng - FROM PASTE.TXT
 */
function getSnippetHinhPhang(): string {
  return `%% =============== HÌNH HỌC PHẲNG ===============
% -- Vẽ tam giác ABC
\\draw(A)--(B)--(C)--cycle; % vẽ các đoạn thẳng AB, AC, BC tạo thành tam giác ABC
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% -- Kẻ AH vuông góc với BC (đường cao từ A xuống BC)
\\draw (A)--(vuonggoc cs:from=A, on=B--C) coordinate(H);

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Hoặc dùng lệnh sau (Từ B kẻ BH vuông góc với AD tại H)
\\draw (B) -- ($(A)!(B)!(D)$) coordinate(H); 
\\pic[draw,thin,angle radius=3mm] {right angle = A--H--B}; 
% ^ Lệnh \\pic để vẽ kí hiệu góc vuông AHB

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- M là trung điểm BC hoặc AM là đường trung tuyến
\\coordinate(M) at ($(B)!0.5!(C)$); % Khai báo M là trung điểm cạnh BC
\\draw (A)--(M); % Vẽ đường trung tuyến AM

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- BD là đường phân giác của góc ABC
\\bisectorpoint(A,B,C)(D)
\\draw (B)--(D); % Vẽ đường phân giác BD

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Hiển thị tên các điểm (A, B, C, H,...) bằng vòng lặp foreach
%   Ví dụ các điểm A/90, B/-90, C/-90, H/-90 (tùy vị trí thực tế)
\\foreach \\i/\\g in {A/90,B/-90,C/-90,H/-90}{%
   \\draw[fill=white](\\i) circle (1.5pt)
        ($( \\i )+(\\g:3mm)$) node[scale=1]{$\\i$};
}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Vẽ tam giác ABC vuông tại C, 
\\draw (A)--(B)--(tamgiacvuong cs:on=A--B) coordinate(C)--cycle;

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Vẽ tam giác ABC cân tại A
%    Ký hiệu cạnh AB và AC bằng dấu "|"
\\coordinate (A) at (0,5);
\\coordinate (B) at (-2,0);
\\coordinate (C) at (2,0);
\\path (A)--(B) node[midway,sloped,scale=0.5]{$|$};
\\path (A)--(C) node[midway,sloped,scale=0.5]{$|$};
\\draw(A)--(B)--(C)--cycle;

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Vẽ tam giác đều ABC (độ dài cạnh = \\canh)
\\def\\canh{5}
\\coordinate (B) at (0,0);
\\coordinate (C) at (\\canh,0);
\\coordinate (A) at ($(B) + (60:\\canh)$);
\\draw(A)--(B)--(C)--cycle;
\\path (A)--(B) node[midway,sloped,scale=0.5]{$|$};
\\path (A)--(C) node[midway,sloped,scale=0.5]{$|$};
\\path (B)--(C) node[midway,sloped,scale=0.5]{$|$};

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Vẽ đường tròn nội tiếp tam giác ABC, tâm I
\\inradius(A,B,C)(\\r)  % Tìm bán kính
\\incenter(A,B,C)(I)   % Xác định tâm I
\\draw (I) circle(\\r); % Vẽ đường tròn nội tiếp

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Vẽ đường tròn ngoại tiếp tam giác ABC, tâm O
\\circumcenter(A,B,C)(O) % Xác định tâm O
\\circumradius(A,B,C)(\\R)
\\draw (O) circle(\\R);   % Vẽ đường tròn ngoại tiếp

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Vẽ đường tròn tâm A, bán kính 3cm (tên đường tròn T)
\\path[name path=T] (A) circle (3 cm);

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Vẽ đường tròn tâm A, đi qua điểm M
\\tikzlength(A,M)(\\r) % Tính độ dài đoạn AM -> \\r
\\draw (A) circle(\\r);

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Vẽ hai đường thẳng AB và MN song song
\\coordinate (N) at ($(B)+(M)-(A)$);
\\draw (N)--(M); % MN // AB

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Vẽ tiếp tuyến tại M, thuộc đường tròn tâm A (có sẵn A, M)
\\coordinate (Tempt1) at ($(M)!1cm!90:(A)$);
\\coordinate (Tempt2) at ($(M)!0cm!-90:(A)$);
\\draw (Tempt1)--(Tempt2);

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Vẽ tiếp tuyến đường tròn tâm O, bán kính 3cm từ M
\\tangentpoints(M,O,3cm)(A,B)
% ^ 2 tiếp điểm là A,B

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Vẽ AB cắt CD tại O (giao điểm)
\\coordinate (O) at (intersection of A--B and C--D);

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Đường thẳng d cắt đường tròn tâm O tại 2 điểm
\\interLC(A,B,O,3cm)(M,N)

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- 2 đường tròn T và P cắt nhau tại A,B
\\path [name intersections={of=T and P,by={A,B}}];

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- B là điểm đối xứng với A qua O
\\coordinate (B) at ($(O)!-1!(A)$);

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Vẽ hình thang cân ABCD
\\coordinate (A) at (1,3);
\\coordinate (B) at (4,3);
\\coordinate (D) at (0,0);
\\coordinate (C) at (5,0);
\\draw(A)--(B)--(C)--(D)--cycle;

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Vẽ hình bình hành ABCD
\\coordinate (A) at (1,3);
\\coordinate (B) at (6,3);
\\coordinate (D) at (0,0);
\\coordinate (C) at ($(B)+(D)-(A)$);
\\draw(A)--(B)--(C)--(D)--cycle;

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Vẽ hình thoi ABCD, cạnh = 4
\\def\\canh{4}
\\coordinate (A) at (0,0);
\\coordinate (B) at ($(A)+(-65:\\canh)$);
\\coordinate (D) at ($(A)+(-115:\\canh)$);
\\coordinate (C) at ($(B)+(D)-(A)$);
\\draw(A)--(B)--(C)--(D)--cycle;

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Vẽ hình chữ nhật ABCD
\\coordinate (A) at (0,3);
\\coordinate (B) at (5,3);
\\coordinate (D) at (0,0);
\\coordinate (C) at ($(B)+(D)-(A)$);
\\draw(A)--(B)--(C)--(D)--cycle;

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Vẽ hình vuông ABCD, cạnh = 4
\\def\\canh{4}
\\coordinate (A) at (0,\\canh);
\\coordinate (B) at (\\canh,\\canh);
\\coordinate (D) at (0,0);
\\coordinate (C) at ($(B)+(D)-(A)$);
\\draw(A)--(B)--(C)--(D)--cycle;
% Kí hiệu 2 đoạn AB & CD bằng nhau:
\\path (A)--(B) node[midway,sloped,scale=0.2]{$|$};
\\path (C)--(D) node[midway,sloped,scale=0.2]{$|$};

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Lấy điểm A thuộc đường tròn tâm O, bán kính 3 cm, góc 40 độ
\\coordinate (A) at ($(O) + (40:3)$);

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- G là trọng tâm tam giác ABC
\\centroid(A,B,C)(G)

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- H là trực tâm tam giác ABC
\\orthocenter(A,B,C)(H)

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Từ M kẻ đường thẳng //CD, cắt AB tại N, vẽ MN
\\draw (M)--(songsong cs:from=M, to=C--D, on=A--B) coordinate(N);

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- N là điểm đối xứng A qua M, vẽ AN
\\draw (A)--(doixungtam cs:from=A,to=M) coordinate(N);
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%`;
}

/**
 * Snippet đầy đủ cho hình không gian - FROM PASTE.TXT
 */
function getSnippetHinhKhongGian(): string {
  return `%% =============== HÌNH KHÔNG GIAN ===============
% ... (chèn lệnh chóp, lăng trụ, cầu, nón, trụ, v.v.)
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Vẽ hình nón
\\begin{tikzpicture}[line join=round, line cap=round, font=\\scriptsize]
  \\def\\a{2}
  \\def\\b{1}
  \\def\\h{4}

  % Vẽ cung elip đáy (dashed), đường sinh, đường cao
  \\draw[dashed] (180:\\a) arc (180:0:{\\a} and {\\b})
                (90:\\h)--(0,0) node[midway,right]{$h$} 
                (0,0)--(0:\\a);

  % Vẽ phần còn lại (mặt xung quanh + ellip trên)
  \\draw (-\\a,\\h)--(-\\a,0) 
        arc (180:360:{\\a} and {\\b})--(\\a,\\h) node[midway,right]{$l$}
        (90:\\h) ellipse ({\\a} and {\\b})
        (90:\\h)--(\\a,\\h) node[midway,above]{$r$};
\\end{tikzpicture}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Vẽ hình trụ
\\begin{tikzpicture}[line join=round, line cap=round, font=\\scriptsize]
  \\def\\a{2}
  \\def\\b{1}
  \\def\\h{3}

  % Tính góc g = asin(b/h), xác định xo = a*cos(g), yo = b*sin(g)
  \\pgfmathsetmacro\\g{asin(\\b/\\h)}
  \\pgfmathsetmacro\\xo{\\a*cos(\\g)}
  \\pgfmathsetmacro\\yo{\\b*sin(\\g)}

  % Phần đáy elip (dashed), đường cao, đường sinh
  \\draw[dashed](\\xo,\\yo) arc (\\g:180-\\g:{\\a} and {\\b})(180:\\a)--(0,0) 
        node[midway,below]{$r$}
        (0,0)--(0:\\a)
        (90:\\h)--(0,0) node[midway,right]{$h$};

  % Mặt xung quanh
  \\draw (90:\\h)--(-\\xo,\\yo) node[midway,slopped,above]{$l$}
        arc(180-\\g:360+\\g:{\\a} and {\\b})--cycle;
\\end{tikzpicture}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Vẽ hình cầu, bán kính = 3
\\begin{tikzpicture}
  \\def\\r{3}

  % Cung elip dashed, đường kính
  \\draw[dashed](180:\\r) arc (180:0:{\\r} and {.3*\\r})
               (90:\\r) arc (90:-90:{.3*\\r} and {\\r})
               (0,0) node[below]{$O$}--(30:\\r) circle(0.04) 
               node[right]{$A$} node[midway,above]{$r$};

  % Vẽ hình cầu
  \\draw (0:0) circle(\\r)
        (180:\\r) arc(180:360:{\\r} and {.3*\\r})
        (90:\\r) arc(90:270:{.3*\\r} and {\\r});

  % Chấm O, A
  \\draw (0,0) circle(0.04) (30:\\r) circle(0.04);
\\end{tikzpicture}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Vẽ hình hộp chữ nhật ABCD.MNPQ
\\begin{tikzpicture}[scale=1,font=\\footnotesize, join=round, line cap=round, >=stealth]
  \\path
    (-1,-1) coordinate(A)
    (0,0)   coordinate(B)
    (3,0)   coordinate(C)
    ($(A)+(C)-(B)$) coordinate(D)
    (0,2)   coordinate(N)
    ($(A)+(N)-(B)$) coordinate(M)
    ($(M)+(C)-(B)$) coordinate(Q)
    ($(N)+(Q)-(M)$) coordinate(P);
  
  \\draw (A)--(M)--(N)--(P)--(C)--(D)--cycle
        (M)--(Q)--(D) (Q)--(P);
  \\draw[dashed](A)--(B)--(C) (B)--(N);

  % Gắn nhãn các điểm
  \\foreach \\x/\\g in {A/180,B/180,C/0,D/0,M/180,N/180,P/0,Q/0}
    \\fill[black](\\x) circle(1pt) ($( \\x )+(\\g:3mm)$) node{\\footnotesize $\\x$};
\\end{tikzpicture}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Vẽ lăng trụ đứng tam giác ABC.A'B'C'
\\begin{tikzpicture}[scale=.7, font=\\footnotesize, line join=round, line cap=round, >=stealth]
  \\def\\a{3} % BC
  \\def\\b{4} % AC
  \\def\\c{5} % AB
  \\def\\h{6} % chiều cao

  \\coordinate (A) at (0,0);
  \\coordinate (B) at (0:\\c);

  % Xác định C bằng giao 2 vòng tròn => c1, c2
  \\path [name path=c1] (A) circle(\\b);
  \\path [name path=c2] (B) circle(\\a);
  \\path [name intersections={of=c1 and c2,by={D,C}}];

  \\path ($(B)!(A)!(C)$) coordinate(H); % (H) có thể làm gì thêm tuỳ bài

  \\coordinate (A') at ($(A)+(90:\\h)$);
  \\coordinate (B') at ($(B)-(A)+(A')$);
  \\coordinate (C') at ($(C)-(A)+(A')$);

  \\draw (A')--(A)--(C) node[below,midway,sloped]{$4 cm$}
        --(B) node[below,midway,sloped]{$3 cm$}
        --(B')--(A')--(C')--(B') (C)--(C');

  \\draw[dashed] (A)--(B) node[above,midway,sloped]{$5 cm$};
  \\draw[dashed] (B)--(B') node[right,midway]{$6 cm$};

  \\foreach \\diem/\\g in {A/180,B/0,C/270,A'/90,B'/90,C'/90}
    \\fill (\\diem) circle(1.5pt) +(\\g:.3) node{$\\diem$};

  \\foreach \\diem in {A,B,C,A',B',C'}
    \\fill (\\diem) circle(1.5pt);
\\end{tikzpicture}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Vẽ hình chóp tam giác đều S.ABC
\\begin{tikzpicture}[scale=1, font=\\footnotesize, line join=round, line cap=round, >=stealth]
  \\def\\ac{4} % cạnh AC
  \\def\\ab{2} % cạnh AB
  \\def\\h{4}  % chiều cao
  \\def\\gocA{50} % góc A của đáy

  \\coordinate[label=left:$A$] (A) at (0,0);
  \\coordinate[label=right:$C$] (C) at (\\ac,0);
  \\coordinate[label=below left:$B$] (B) at (-\\gocA:\\ab);

  % Trung điểm BC -> M, O = 2/3 AM
  \\coordinate (M) at ($(B)!.5!(C)$);
  \\coordinate[label=below right:$O$] (G) at ($(A)!2/3!(M)$);

  % Đỉnh S = G + (0,0) theo hướng 90 độ, khoảng h
  \\coordinate[label=above:$S$] (S) at ($(G)+(90:\\h)$);

  \\draw (A)--(B)--(C)--(S)--cycle (S)--(B);
  \\draw[dashed] (A)--(C) (S)--(G);

  \\foreach \\diem in {A,B,C,S,G}
    \\fill (\\diem) circle(1pt);

  % Kí hiệu cạnh Sx = |, các cạnh đế = ||
  \\foreach \\dau/\\cuoi in {S/A,S/B,S/C}
    \\path (\\dau)--(\\cuoi) node[midway,sloped]{$|$};
  \\foreach \\dau/\\cuoi in {A/B,C/B,A/C}
    \\path (\\dau)--(\\cuoi) node[midway,sloped]{$||$};
\\end{tikzpicture}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Vẽ hình chóp tứ giác đều S.ABCD
\\begin{tikzpicture}[scale=1, font=\\footnotesize, line join=round, line cap=round, >=stealth]
  \\def\\bc{4} % cạnh BC
  \\def\\ba{2} % cạnh BA
  \\def\\h{4}  % đường cao
  \\def\\gocB{45} % góc B

  \\coordinate[label=below left:$B$] (B) at (0,0);
  \\coordinate[label=above right:$A$] (A) at (\\gocB:\\ba);
  \\coordinate[label=below:$C$] (C) at (\\bc,0);
  \\coordinate[label=right:$D$] (D) at ($(C)-(B)+(A)$);

  % O trung điểm AC -> S trên O+(90:h)
  \\coordinate[label=below:$O$] (O) at ($(A)!.5!(C)$);
  \\coordinate[label=above:$S$] (S) at ($(O)+(90:\\h)$);

  \\draw (B)--(C)--(D)--(S)--cycle (S)--(C);
  \\draw[dashed] (C)--(A)--(D)--(B) (O)--(S)--(A)--(B);

  \\foreach \\diem in {A,B,C,D,S,O}
    \\fill (\\diem) circle(1pt);

  % Kí hiệu |, ||
  \\foreach \\dau/\\cuoi in {S/A,S/B,S/D,S/C}
    \\path (\\dau)--(\\cuoi) node[midway,sloped]{$|$};
  \\foreach \\dau/\\cuoi in {A/B,B/C,C/D,D/A}
    \\path (\\dau)--(\\cuoi) node[midway,sloped]{$||$};

  % Góc vuông (A/B/C, B/C/D, C/D/A, D/A/B)
  \\foreach \\mot/\\hai/\\ba in {A/B/C, B/C/D, C/D/A, D/A/B}
    \\draw pic[draw=black,angle radius=5pt] {right angle = \\mot--\\hai--\\ba};
\\end{tikzpicture}`;
}

/**
 * Snippet cho đồ thị hàm số - FROM PASTE.TXT
 */
function getSnippetDoThi(): string {
  return `%% =============== ĐỒ THỊ HÀM SỐ ===============
% ... (bậc 2, bậc 3, phân thức, trùng phương, ...)
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Đồ thị hàm số bậc hai y = x^2 + 2x + 3
%    -1 là nghiệm của đạo hàm 2x + 2, f(-1)=2
\\begin{tikzpicture}[line join=round, line cap=round, >=stealth, thin]
  % Tùy chọn scale trục Ox từ -4.1..4.1 và Oy từ -4.1..4.1
  \\tikzset{every node/.style={scale=0.9}}

  % Vẽ trục Ox, Oy
  \\draw[->] (-4.1,0)--(4.1,0) node[below left] {$x$};
  \\draw[->] (0,-4.1)--(0,4.1) node[below left] {$y$};

  % Gắn nhãn gốc toạ độ
  \\draw (0,0) node[below left] {$O$};

  % Đánh dấu các vạch trên Ox
  \\foreach \\x/\\nx in {-3/-3, -2/-2, -1/-1, 1/1, 2/2, 3/3}
    \\draw[thin] (\\x,1pt)--(\\x,-1pt) node[below] {$\\nx$};

  % Đánh dấu các vạch trên Oy
  \\foreach \\y/\\ny in {-3/-3, -2/-2, -1/-1, 1/1, 2/2, 3/3}
    \\draw[thin] (1pt,\\y)--(-1pt,\\y) node[left] {$\\ny$};

  % Ví dụ vẽ đường gióng (dashed) từ x=-1 lên y=2
  \\draw[dashed,thin](-1,0)--(-1,2)--(0,2);

  % Vẽ đồ thị f(x) = x^2 + 2x + 3, domain=-3..3
  \\begin{scope}
    \\clip (-4,-4) rectangle (4,4);
    \\draw[samples=200, domain=-3:3, smooth, variable=\\x]
         plot (\\x, {(\\x)^2 + 2*(\\x) + 3});
  \\end{scope}
\\end{tikzpicture}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Đồ thị hàm số bậc ba y = x^3 + 3x^2 - 4
%    domain=-3..3, trục Ox,Oy từ -4.1..4.1
\\begin{tikzpicture}[line join=round, line cap=round, >=stealth, thin]
  \\tikzset{every node/.style={scale=0.9}}

  \\draw[->] (-4.1,0)--(4.1,0) node[below left] {$x$};
  \\draw[->] (0,-4.1)--(0,4.1) node[below left] {$y$};
  \\draw (0,0) node[below left] {$O$};

  \\foreach \\x/\\nx in {-4/-4, -3/-3, -2/-2, -1/-1, 1/1, 2/2, 3/3, 4/4}
    \\draw[thin] (\\x,1pt)--(\\x,-1pt) node[below] {$\\nx$};

  \\foreach \\y/\\ny in {-4/-4, -3/-3, -2/-2, -1/-1, 1/1, 2/2, 3/3, 4/4}
    \\draw[thin] (1pt,\\y)--(-1pt,\\y) node[left] {$\\ny$};

  \\begin{scope}
    \\clip (-4,-4) rectangle (4,4);
    \\draw[samples=200,domain=-3:3,smooth,variable=\\x]
         plot (\\x,{(\\x)^3 + 3*(\\x)^2 -4});
  \\end{scope}
\\end{tikzpicture}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Đồ thị hàm phân thức y = (x+1)/(3x+2)
%    x=-2/3 tiệm cận đứng, y=1/3 tiệm cận ngang
%    \\def\\xmin=-4, \\def\\xmax=2, \\def\\ymin=-3, \\def\\ymax=3
\\begin{tikzpicture}[scale=1, font=\\footnotesize, line join=round, line cap=round, >=stealth]
  \\def\\xmin{-4} \\def\\xmax{2} \\def\\ymin{-3} \\def\\ymax{3}

  % Vẽ trục Ox,Oy
  \\draw[->] (\\xmin-0.2,0)--(\\xmax+0.2,0) node[below] {$x$};
  \\draw[->] (0,\\ymin-0.2)--(0,\\ymax+0.2) node[right] {$y$};
  \\draw (0,0) node [below left] {$O$};

  % Đánh dấu vạch Ox
  \\foreach \\x in {-4,-3,-2,-1,1,2}
    \\draw (\\x,0.1)--(\\x,-0.1) node[below] {\\x};

  % Đánh dấu vạch Oy
  \\foreach \\y in {-3,-2,-1,1,2,3}
    \\draw (0.1,\\y)--(-0.1,\\y) node[left] {\\y};

  % Cắt khung vẽ
  \\clip (\\xmin,\\ymin) rectangle (\\xmax,\\ymax);

  % Tiệm cận ngang y=1/3
  \\draw[dashed] (\\xmin,0.33)--(\\xmax,0.33);

  % Tiệm cận đứng x=-0.67
  \\draw[dashed] (-0.67,\\ymin)--(-0.67,\\ymax);

  % Vẽ đồ thị 2 đoạn (do domain bị chặn ở x=-2/3)
  \\draw[smooth,samples=200,domain=\\xmin:-0.77]
       plot (\\x,{(\\x+1)/(3*\\x+2)});
  \\draw[smooth,samples=200,domain=-0.57:\\xmax]
       plot (\\x,{(\\x+1)/(3*\\x+2)});

  % Đánh dấu x=-2/3
  \\draw (-0.67,-1pt)--(-0.67,1pt) node [below right] {$-\\frac{2}{3}$};
  % Đánh dấu y=1/3
  \\draw (1pt,0.33)--(-1pt,0.33) node [right] {$\\frac{1}{3}$};
\\end{tikzpicture}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Đồ thị hàm số trùng phương y = x^4 - 2x^2 - 3
%    \\def\\xmin=-3.15, \\def\\xmax=3.15, \\def\\ymin=-4, \\def\\ymax=4
\\begin{tikzpicture}[scale=.7, >=stealth]
  \\def\\xmin{-3.15} \\def\\xmax{3.15}
  \\def\\ymin{-4}    \\def\\ymax{4}

  \\draw[->] (\\xmin,0)--(\\xmax,0) node[right] {$x$};
  \\draw[->] (0,\\ymin)--(0,\\ymax) node[above] {$y$};
  \\draw (0,0) node[below right] {$O$};

  \\foreach \\x in {-3,-2,-1,1,2,3}
    \\draw (\\x,0.1)--(\\x,-0.1) node[below] {\\x};

  \\foreach \\y in {-4,-3,-2,-1,1,2,3,4}
    \\draw (0.1,\\y)--(-0.1,\\y) node[left] {\\y};

  % Vẽ đồ thị f(x)=x^4 -2x^2 -3, domain=\\xmin.. \\xmax
  \\draw[samples=200,domain=\\xmin:\\xmax,smooth,variable=\\x]
       plot(\\x,{(\\x)^4 -2*(\\x)^2 -3});

  % Ví dụ vẽ đường dashed gióng tại x=-1, x=1, y=-3
  \\draw[dashed] (-1,0)--(-1,-4)--(0,-4);
  \\draw[dashed] (1,0)--(1,-4);
  \\draw[dashed] (0,-3)--(\\xmax,-3);
\\end{tikzpicture}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Đồ thị hàm phân thức y = (x^2+2x+5)/(x+1)
%    x=-1 tiệm cận đứng, y=x+1 tiệm cận xiên
%    Đạt cực đại (-3,-4), cực tiểu (1,4)
%    \\def\\xmin=-5, \\def\\xmax=3, \\def\\ymin=-7, \\def\\ymax=7
\\begin{tikzpicture}[scale=1, font=\\footnotesize, line join=round, line cap=round, >=stealth]
  \\def\\xmin{-5} \\def\\xmax{3} \\def\\ymin{-7} \\def\\ymax{7}

  \\draw[->] (\\xmin-0.2,0)--(\\xmax+0.2,0) node[below] {$x$};
  \\draw[->] (0,\\ymin-0.2)--(0,\\ymax+0.2) node[right] {$y$};
  \\draw (0,0) node [below left] {$O$};

  \\foreach \\x in {-5,-4,-3,-2,-1,1,2,3}
    \\draw (\\x,0.1)--(\\x,-0.1) node[below] {\\x};

  \\foreach \\y in {-7,-6,-5,-4,-3,-2,-1,1,2,3,4,5,6,7}
    \\draw (0.1,\\y)--(-0.1,\\y) node[left] {\\y};

  \\clip (\\xmin,\\ymin) rectangle (\\xmax,\\ymax);

  % Tiệm cận đứng x=-1
  \\draw[dashed] (-1,\\ymin)--(-1,\\ymax);

  % Tiệm cận xiên y=x+1
  \\draw[dashed,domain=\\xmin:\\xmax] plot(\\x,{(\\x)+1});

  % Vẽ đồ thị 2 đoạn (domain tách ở x=-1)
  \\draw[smooth,samples=200,domain=\\xmin:-1.1] 
       plot(\\x, {( (\\x)^2 + 2*\\x + 5 )/( \\x +1 )} );
  \\draw[smooth,samples=200,domain=-0.9:\\xmax]
       plot(\\x, {( (\\x)^2 + 2*\\x + 5 )/( \\x +1 )} );

  % Ví dụ các điểm cực đại (-3,-4) và cực tiểu (1,4) - gạch check
  \\draw[dashed] (-3,0)--(-3,-4)--(0,-4);
  \\fill (-3,-4) circle(1pt);
  \\draw[dashed] (1,0)--(1,4)--(0,4);
  \\fill (1,4) circle(1pt);
\\end{tikzpicture}`;
}

/**
 * Snippet cho bảng biến thiên - FROM PASTE.TXT
 */
function getSnippetBangBienThien(): string {
  return `%% =============== BẢNG BIẾN THIÊN ===============
% ... (tkz-tab)
% -- Bảng biến thiên hàm số bậc hai y = x^2 + 2x + 3
\\begin{tikzpicture}
  \\tkzTabInit[nocadre,lgt=1.5,espcl=5,deltacl=0.6]
     {$x$/0.7,$y'$/0.7,$y$/2}{$-\\infty$,$-1$,$+\\infty$}
  \\tkzTabLine{,-,0,+,}
  \\tkzTabVar{+/$+\\infty$,-/$2$,+/$+\\infty$}
\\end{tikzpicture}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Bảng biến thiên hàm số bậc ba y = x^3 + 3x^2 - 2
%    -2 và 0 là nghiệm của 3x^2 + 6x (đạo hàm)
%    f(-2)=2, f(0)=-2
\\begin{tikzpicture}
  \\tkzTabInit[nocadre,lgt=1.5,espcl=2.5,deltacl=0.7]
     {$x$/0.6,$y'$/0.6,$y$/2}
     {$-\\infty$,$-2$,$0$,$+\\infty$}
  \\tkzTabLine{,+,0,-,0,+,}
  \\tkzTabVar{-/$-\\infty$,+/$2$,-/$-2$,+/$+\\infty$}
\\end{tikzpicture}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Bảng biến thiên hàm phân thức y = (x+1)/(3x+2)
%    x = -2/3 là tiệm cận đứng, y = 1/3 là tiệm cận ngang
%    Hàm số nghịch biến trên (-∞, -2/3) và (-2/3, +∞)
\\begin{tikzpicture}
  \\tkzTabInit[nocadre,lgt=1.2,espcl=2.5,deltacl=0.6]
     {$x$/0.6,$y'$/0.6,$y$/2}
     {$-\\infty$,$-\\frac{2}{3}$,$+\\infty$}
  \\tkzTabLine{,-,d,-,}
  \\tkzTabVar{+/$\\frac{1}{3}$,-D+/$-\\infty$/$+\\infty$,-/$\\frac{1}{3}$}
\\end{tikzpicture}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Bảng biến thiên hàm trùng phương y = x^4 - 2x^2 - 3
%    -1, 0, 1 là nghiệm của đạo hàm 4x^3 - 4x
%    f(-1)=-4, f(0)=-3, f(1)=-4
\\begin{tikzpicture}
  \\tkzTabInit[espcl=3,lgt=1.5,nocadre]
     {$x$/0.6,$y'$/0.6,$y$/2}
     {$-\\infty$,$-1$,0,$1$,$+\\infty$}
  \\tkzTabLine{,-,0,+,0,-,0,+}
  \\tkzTabVar{+/$+\\infty$,-/$-4$,+/$-3$,-/$-4$,+/$+\\infty$}
\\end{tikzpicture}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Bảng biến thiên hàm phân thức y = (x^2 + 2x + 5)/(x+1)
%    x=-1 tiệm cận đứng, y = x+1 tiệm cận xiên
%    Đạt cực đại (-3,-4), cực tiểu (1,4)
\\begin{tikzpicture}
  \\tkzTabInit[nocadre,lgt=1.2,espcl=2.5,deltacl=0.6]
     {$x$/0.6,$y'$/0.6,$y$/2}
     {$-\\infty$,$-3$,$-1$,$1$,$+\\infty$}
  \\tkzTabLine{,+,0,-,d,-,0,+,}
  \\tkzTabVar{-/$-\\infty$,+/$-4$,-D+/$-\\infty$/$+\\infty$,-/$4$,+/$+\\infty$}
\\end{tikzpicture}`;
}

/**
 * Snippet cho trục số - FROM PASTE.TXT
 */
function getSnippetTrucSo(): string {
  return `%% =============== TRỤC SỐ / XÉT DẤU ===============
% -- Vẽ trục số, tô một đoạn (a, b]
\\begin{tikzpicture}[line join=round, line cap=round, >=stealth, thick]
  % Tô vùng từ x=-4 đến x=-1.5
  \\fill[pattern=north east lines](-4,-0.15) rectangle (-1.5,0.15);

  % Vẽ trục số từ -4 đến +4 (mũi tên)
  \\draw[->] (-4,0)--(4,0);

  % Dấu ngoặc ( tại x=-1.5
  \\draw (-1.5,0) node {$\\big($} 
        (-1.5,0) node[below=6pt] {$a$};

  % Dấu ngoặc ] tại x=0.75
  \\draw (0.75,0) node {$\\big]$} 
        (0.75,0) node[below=6pt] {$b$};
\\end{tikzpicture}`;
}

/**
 * Snippet cho biểu đồ thống kê - FROM PASTE.TXT
 */
function getSnippetBieuDo(): string {
  return `%% =============== BIỂU ĐỒ (cột, tròn, ...) ===============
% -- Vẽ biểu đồ cột màu magenta với 3 cột
\\begin{tikzpicture}[scale=.5,font=\\scriptsize]
  % Trục Ox từ (0,0) đến (16,0), trục Oy từ (0,0) đến (0,5.5)
  \\draw[->] (0,0)--(16,0) node[below]{$x$};
  \\draw[->] (0,0)--(0,5.5) node[left]{$n$};

  % Duyệt 3 giá trị cột (10/3, 12/4, 15/5) 
  % Mỗi cột: \\x/\\n => \\x là nhãn dưới, \\n là chiều cao
  % \\i chạy từ 1 (vì [count=\\i from 1])
  \\foreach \\x/\\n[count=\\i from 1] in {10/3,12/4,15/5}{
    % Vẽ cột màu magenta: line width=4mm
    \\draw[line width=4mm,magenta] (\\i,0) node[below, black]{$\\x$}
                     --++(0,\\n);

    % Vẽ đường gạch ngang từ cột qua trục Oy
    \\draw[dashed] (\\i,\\n)--(0,\\n) node[left]{$\\n$};
  }
\\end{tikzpicture}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% -- Vẽ biểu đồ cột với 4 giá trị: Giỏi(20%), Khá(35%), Đạt(40%), Chưa đạt(5%)
\\begin{tikzpicture}
  % Khai báo bán kính r=2, gocxp=90 (để bắt đầu vẽ cung)
  \\def\\r{2}
  \\def\\gocxp{90}

  % Đặt A tại (90:\\r)
  \\coordinate (A) at (90:\\r);

  % Lần lượt 4 giá trị: Giỏi/20, Khá/35, Đạt/40, Chưa đạt/5
  % Pattern: horizontal lines, north east lines, grid, bricks
  % Mỗi vòng lặp vẽ 1 cung tròn (pie chart) & 1 ô chú thích
  \\foreach \\val/\\freq/\\col/\\pattern[count=\\i from 0] 
      in {Giỏi/20/red/horizontal lines,
          Khá/35/green/north east lines,
          Đạt/40/blue/grid,
          Chưa đạt/5/magenta/bricks}{
    
    % Tính góc kết thúc gockt
    \\pgfmathsetmacro\\gockt{-(\\freq*3.6 - \\gocxp)}
    % gocnode = góc trung bình, để đặt nhãn \\freq%
    \\pgfmathsetmacro\\gocnode{\\gocxp + \\gockt}

    % Vẽ cung tròn: arc(\\gocxp:\\gockt:\\r) 
    \\draw[gray!50,pattern=\\pattern,pattern color=\\col]
          (0,0)--(A) arc(\\gocxp:\\gockt:\\r) coordinate(A)--cycle;

    % Vẽ khối chú thích ở (r+1, r-0.75*\\i)
    \\fill[pattern=\\pattern,pattern color=\\col]
          (\\r+1,\\r-0.75*\\i)
          --++(0:1.25)
          --++(-90:.5) node[pos=.5,right,black]{\\val}
          --++(180:1.25)--cycle;
    
    % Vẽ nhãn \\freq% bên trong hình (pie chart)
    \\path ($(0,0)+(\\gocnode/2:1.1)$) 
         node[fill=white,inner sep=0pt,circle]
         {\\color{black} $\\freq\\%$};

    % Cập nhật gocxp=gockt để nối tiếp cung
    \\global\\let\\gocxp=\\gockt
  }
\\end{tikzpicture}`;
}

// ===== 🎨 MAIN TIKZ FUNCTIONS - FROM PASTE.TXT =====

/**
 * Phân tích yêu cầu và lấy snippet TikZ phù hợp - FROM PASTE.TXT
 */
export function getTikzSnippetsForQuery(query: string): string {
  const queryLower = query.toLowerCase();
  const relevantSnippets: string[] = [];

  // Phân loại theo chủ đề
  if (queryLower.includes('tam giác') || queryLower.includes('hình vuông') ||
      queryLower.includes('hình tròn') || queryLower.includes('đường tròn') ||
      queryLower.includes('hình chữ nhật') || queryLower.includes('hình thoi') ||
      queryLower.includes('hình bình hành') || queryLower.includes('vectơ') || queryLower.includes('hệ thức lượng') || queryLower.includes('toạ độ trong mặt phẳng')) {
    relevantSnippets.push(getSnippetHinhPhang());
  }

  if (queryLower.includes('hình nón') || queryLower.includes('hình trụ') ||
      queryLower.includes('hình cầu') || queryLower.includes('lăng trụ') ||
      queryLower.includes('hình chóp') || queryLower.includes('hình hộp') || queryLower.includes('không gian')) {
    relevantSnippets.push(getSnippetHinhKhongGian());
  }

  if (queryLower.includes('đồ thị') || queryLower.includes('hàm số') ||
      queryLower.includes('bậc hai') || queryLower.includes('bậc ba') ||
      queryLower.includes('phân thức') || queryLower.includes('parabol') || queryLower.includes('khảo sát')) {
    relevantSnippets.push(getSnippetDoThi());
  }

  if (queryLower.includes('bảng biến thiên') || queryLower.includes('biến thiên') ||
      queryLower.includes('cực trị') || queryLower.includes('đạo hàm') || queryLower.includes('khảo sát')) {
    relevantSnippets.push(getSnippetBangBienThien());
  }

  if (queryLower.includes('trục số') || queryLower.includes('xét dấu') ||
      queryLower.includes('nghiệm') || queryLower.includes('khoảng') || queryLower.includes('bất phương trình')) {
    relevantSnippets.push(getSnippetTrucSo());
  }

  if (queryLower.includes('biểu đồ') || queryLower.includes('thống kê') ||
      queryLower.includes('cột') || queryLower.includes('tròn')) {
    relevantSnippets.push(getSnippetBieuDo());
  }

  // Nếu không có snippet cụ thể, trả về tất cả để tham khảo chung
  if (relevantSnippets.length === 0) {
    return [
      getSnippetHinhPhang(),
      getSnippetHinhKhongGian(),
      getSnippetDoThi(),
      getSnippetBangBienThien(),
      getSnippetTrucSo(),
      getSnippetBieuDo()
    ].join('\n\n');
  }

  return [...new Set(relevantSnippets)].join('\n\n');
}
