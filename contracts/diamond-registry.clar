;; DiamondRegistry.clar
;; Core contract for registering and managing diamond entries in the DiamondTrace system.
;; Handles initial registration of diamonds with unique hashes, metadata, and origin details.
;; Only authorized miners (via AuthorityRegistry) can register diamonds.
;; Supports metadata updates, status management, and querying for provenance verification.

;; Constants
(define-constant ERR-UNAUTHORIZED u100)
(define-constant ERR-ALREADY-REGISTERED u101)
(define-constant ERR-INVALID-HASH u102)
(define-constant ERR-INVALID-ORIGIN u103)
(define-constant ERR-INVALID-GEOLOCATION u104)
(define-constant ERR-INVALID-METADATA u105)
(define-constant ERR-INVALID-PHYSICAL-ATTRS u106)
(define-constant ERR-INVALID-STATUS u107)
(define-constant ERR-NOT-OWNER u108)
(define-constant ERR-PAUSED u109)
(define-constant ERR-INVALID-CARAT u110)
(define-constant ERR-INVALID-COLOR u111)
(define-constant ERR-INVALID-CLARITY u112)
(define-constant ERR-INVALID-CUT u113)
(define-constant ERR-NO-AUTHORITY u114)
(define-constant ERR-MAX-METADATA-LEN u115)
(define-constant MAX-METADATA-LEN u500)
(define-constant MAX-ORIGIN-LEN u100)
(define-constant MAX-GEOLOCATION-LEN u50)
(define-constant VALID-COLORS (list "D" "E" "F" "G" "H" "I" "J" "K" "L" "M"))
(define-constant VALID-CLARITY (list "FL" "IF" "VVS1" "VVS2" "VS1" "VS2" "SI1" "SI2"))
(define-constant VALID-CUTS (list "Ideal" "Excellent" "Very Good" "Good" "Fair"))

;; Data Variables
(define-data-var contract-paused bool false)
(define-data-var contract-admin principal tx-sender)

;; Data Maps
(define-map diamonds
  { diamond-hash: (buff 32) }
  {
    owner: principal,
    timestamp: uint,
    origin: (string-utf8 MAX-ORIGIN-LEN),
    geolocation: (string-utf8 MAX-GEOLOCATION-LEN),
    metadata: (string-utf8 MAX-METADATA-LEN),
    carat: uint,
    color: (string-utf8 1),
    clarity: (string-utf8 4),
    cut: (string-utf8 10),
    status: (string-utf8 20),
    is-locked: bool
  }
)

;; Private Functions
(define-private (is-valid-color (color (string-utf8 1)))
  (is-some (index-of VALID-COLORS color))
)

(define-private (is-valid-clarity (clarity (string-utf8 4)))
  (is-some (index-of VALID-CLARITY clarity))
)

(define-private (is-valid-cut (cut (string-utf8 10)))
  (is-some (index-of VALID-CUTS cut))
)

(define-private (is-valid-hash (hash (buff 32)))
  (> (len hash) u0)
)

(define-private (is-valid-origin (origin (string-utf8 MAX-ORIGIN-LEN)))
  (and (> (len origin) u0) (<= (len origin) MAX-ORIGIN-LEN))
)

(define-private (is-valid-geolocation (geolocation (string-utf8 MAX-GEOLOCATION-LEN)))
  (and (> (len geolocation) u0) (<= (len geolocation) MAX-GEOLOCATION-LEN))
)

(define-private (is-valid-metadata (metadata (string-utf8 MAX-METADATA-LEN)))
  (<= (len metadata) MAX-METADATA-LEN)
)

(define-private (is-valid-carat (carat uint))
  (> carat u0)
)

;; Assume AuthorityRegistry contract exists with a function `is-miner`
(define-private (is-authorized-miner (caller principal))
  ;; Mocked for now; in production, this would call AuthorityRegistry.is-miner
  (is-eq caller (var-get contract-admin))
)

;; Public Functions
(define-public (register-diamond
  (hash (buff 32))
  (origin (string-utf8 MAX-ORIGIN-LEN))
  (geolocation (string-utf8 MAX-GEOLOCATION-LEN))
  (metadata (string-utf8 MAX-METADATA-LEN))
  (carat uint)
  (color (string-utf8 1))
  (clarity (string-utf8 4))
  (cut (string-utf8 10)))
  (begin
    (asserts! (not (var-get contract-paused)) (err ERR-PAUSED))
    (asserts! (is-authorized-miner tx-sender) (err ERR-NO-AUTHORITY))
    (asserts! (is-valid-hash hash) (err ERR-INVALID-HASH))
    (asserts! (is-none (map-get? diamonds { diamond-hash: hash })) (err ERR-ALREADY-REGISTERED))
    (asserts! (is-valid-origin origin) (err ERR-INVALID-ORIGIN))
    (asserts! (is-valid-geolocation geolocation) (err ERR-INVALID-GEOLOCATION))
    (asserts! (is-valid-metadata metadata) (err ERR-MAX-METADATA-LEN))
    (asserts! (is-valid-carat carat) (err ERR-INVALID-CARAT))
    (asserts! (is-valid-color color) (err ERR-INVALID-COLOR))
    (asserts! (is-valid-clarity clarity) (err ERR-INVALID-CLARITY))
    (asserts! (is-valid-cut cut) (err ERR-INVALID-CUT))
    (map-set diamonds
      { diamond-hash: hash }
      {
        owner: tx-sender,
        timestamp: block-height,
        origin: origin,
        geolocation: geolocation,
        metadata: metadata,
        carat: carat,
        color: color,
        clarity: clarity,
        cut: cut,
        status: u"Registered",
        is-locked: false
      }
    )
    (ok true)
  )
)

(define-public (update-diamond-metadata
  (hash (buff 32))
  (new-metadata (string-utf8 MAX-METADATA-LEN))
  (new-origin (string-utf8 MAX-ORIGIN-LEN))
  (new-geolocation (string-utf8 MAX-GEOLOCATION-LEN)))
  (let
    (
      (diamond (map-get? diamonds { diamond-hash: hash }))
    )
    (asserts! (not (var-get contract-paused)) (err ERR-PAUSED))
    (asserts! (is-some diamond) (err ERR-INVALID-HASH))
    (asserts! (is-eq (get owner (unwrap-panic diamond)) tx-sender) (err ERR-NOT-OWNER))
    (asserts! (not (get is-locked (unwrap-panic diamond))) (err ERR-INVALID-STATUS))
    (asserts! (is-valid-metadata new-metadata) (err ERR-MAX-METADATA-LEN))
    (asserts! (is-valid-origin new-origin) (err ERR-INVALID-ORIGIN))
    (asserts! (is-valid-geolocation new-geolocation) (err ERR-INVALID-GEOLOCATION))
    (map-set diamonds
      { diamond-hash: hash }
      (merge
        (unwrap-panic diamond)
        {
          metadata: new-metadata,
          origin: new-origin,
          geolocation: new-geolocation,
          timestamp: block-height
        }
      )
    )
    (ok true)
  )
)

(define-public (set-diamond-status
  (hash (buff 32))
  (status (string-utf8 20))
  (is-locked bool))
  (let
    (
      (diamond (map-get? diamonds { diamond-hash: hash }))
    )
    (asserts! (not (var-get contract-paused)) (err ERR-PAUSED))
    (asserts! (is-some diamond) (err ERR-INVALID-HASH))
    (asserts! (is-eq (get owner (unwrap-panic diamond)) tx-sender) (err ERR-NOT-OWNER))
    (asserts! (or (is-eq status u"Registered") (is-eq status u"Pending") (is-eq status u"Certified")) (err ERR-INVALID-STATUS))
    (map-set diamonds
      { diamond-hash: hash }
      (merge
        (unwrap-panic diamond)
        { status: status, is-locked: is-locked, timestamp: block-height }
      )
    )
    (ok true)
  )
)

(define-public (pause-contract)
  (begin
    (asserts! (is-eq tx-sender (var-get contract-admin)) (err ERR-UNAUTHORIZED))
    (var-set contract-paused true)
    (ok true)
  )
)

(define-public (unpause-contract)
  (begin
    (asserts! (is-eq tx-sender (var-get contract-admin)) (err ERR-UNAUTHORIZED))
    (var-set contract-paused false)
    (ok true)
  )
)

(define-public (set-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-admin)) (err ERR-UNAUTHORIZED))
    (var-set contract-admin new-admin)
    (ok true)
  )
)

;; Read-Only Functions
(define-read-only (get-diamond-details (hash (buff 32)))
  (map-get? diamonds { diamond-hash: hash })
)

(define-read-only (is-registered (hash (buff 32)))
  (is-some (map-get? diamonds { diamond-hash: hash }))
)

(define-read-only (is-contract-paused)
  (var-get contract-paused)
)

(define-read-only (get-contract-admin)
  (var-get contract-admin)
)