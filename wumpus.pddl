(define (problem wumpus)
  (:domain wumpus_domain_a)
  (:objects
   sq-1-1 sq-1-2 sq-1-3 sq-1-4
   sq-2-1 sq-2-2 sq-2-3 sq-2-4
   sq-3-1 sq-3-2 sq-3-3 sq-3-4
   sq-4-1 sq-4-2 sq-4-3 sq-4-4
   the-gold
   the-arrow
   agent
   wumpus)

  (:init
   ;; Vertical adjacencies notation: sq-{X-axis-coordinate}-{Y-axis-coordinate}
   (adj sq-1-1 sq-1-2) (adj sq-1-2 sq-1-1)
   (adj sq-1-2 sq-1-3) (adj sq-1-3 sq-1-2)
   (adj sq-1-3 sq-1-4) (adj sq-1-4 sq-1-3)
   (adj sq-2-1 sq-2-2) (adj sq-2-2 sq-2-1)
   (adj sq-2-2 sq-2-3) (adj sq-2-3 sq-2-2)
   (adj sq-2-3 sq-2-4) (adj sq-2-4 sq-2-3)
   (adj sq-3-1 sq-3-2) (adj sq-3-2 sq-3-1)
   (adj sq-3-2 sq-3-3) (adj sq-3-3 sq-3-2)
   (adj sq-3-3 sq-3-4) (adj sq-3-4 sq-3-3)
   (adj sq-4-1 sq-4-2) (adj sq-4-2 sq-4-1)
   (adj sq-4-2 sq-4-3) (adj sq-4-3 sq-4-2)
   (adj sq-4-3 sq-4-4) (adj sq-4-4 sq-4-3)
   
   ;; Horizontal adjacencies notation: sq-{X-axis-coordinate}-{Y-axis-coordinate}
   (adj sq-1-1 sq-2-1) (adj sq-2-1 sq-1-1)
   (adj sq-2-1 sq-3-1) (adj sq-3-1 sq-2-1)
   (adj sq-3-1 sq-4-1) (adj sq-4-1 sq-3-1)
   (adj sq-1-2 sq-2-2) (adj sq-2-2 sq-1-2)
   (adj sq-2-2 sq-3-2) (adj sq-3-2 sq-2-2)
   (adj sq-3-2 sq-4-2) (adj sq-4-2 sq-3-2)
   (adj sq-1-3 sq-2-3) (adj sq-2-3 sq-1-3)
   (adj sq-2-3 sq-3-3) (adj sq-3-3 sq-2-3)
   (adj sq-3-3 sq-4-3) (adj sq-4-3 sq-3-3)
   (adj sq-1-4 sq-2-4) (adj sq-2-4 sq-1-4)
   (adj sq-2-4 sq-3-4) (adj sq-3-4 sq-2-4)
   (adj sq-3-4 sq-4-4) (adj sq-4-4 sq-3-4)
   
   (at the-gold sq-2-3) ;; Gold's location
   
   (pit sq-3-1) ;; Example of a pit
   (pit sq-4-4) ;; Example of a pit
   ;; You have to complete the location for all PITs

   (at agent sq-1-1) ;; Agent starting position
   (have agent the-arrow) ;; Agent starts with an arrow
   (at wumpus sq-1-3)) ;; Wumpus's location

  (:goal (and (have agent the-gold) (at agent sq-1-1)))
  )
