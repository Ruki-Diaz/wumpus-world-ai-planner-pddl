(define (domain wumpus_domain_a)

  (:predicates
   (adj ?square-1 ?square-2)
   (pit ?square)
   (at ?what ?square)
   (have ?who ?what)
   (dead ?who)
   (used ?arrow)
   (wumpus_alive)
   (agent ?who)
  )

  (:action move
    :parameters (?who ?from ?to)
    :precondition (and (adj ?from ?to)
                       (not (pit ?to))
                       (at ?who ?from)
                       (not (dead ?who))
                       (agent ?who))
    :effect (and (not (at ?who ?from))
                 (at ?who ?to))
  )

  (:action take
    :parameters (?who ?what ?where)
    :precondition (and (at ?who ?where)
                       (at ?what ?where)
                       (not (dead ?who)))
    :effect (and (have ?who ?what)
                 (not (at ?what ?where)))
  )

  (:action shoot
    :parameters (?who ?where ?arrow ?victim ?where-victim)
    :precondition (and (have ?who ?arrow)
                       (at ?who ?where)
                       (at ?victim ?where-victim)
                       (adj ?where ?where-victim)
                       (not (used ?arrow)))
    :effect (and (dead ?victim)
                 (not (at ?victim ?where-victim))
                 (not (have ?who ?arrow))
                 (used ?arrow)
                 (not (wumpus_alive)))
  )

)