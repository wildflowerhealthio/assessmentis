import {
  QuestionnaireItemType,
  QuestionnaireItemUIControlCode,
  QuestionnaireItemUiDisplayLevel,
  QuestionnaireItem,
  QuestionnaireItemLink,
  questionnaireItemUiControlCodeExtension,
  questionnaireItemUiDisplayLevelExtension,
} from '@assessmentis/domain/questionnaires'

const sluggify = (s: string): QuestionnaireItemLink =>
  QuestionnaireItemLink.make(
    s
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  )

interface DivaQuestion {
  prefix: string
  questionText: string
  adultSymptoms: string[]
  childQuestionText: string
  childSymptoms: string[]
}

const part1Preamble: QuestionnaireItem[] = [
  {
    text: 'Diagnostic Interview for ADHD in adults (DIVA)',
    linkId: sluggify('title'),
    type: QuestionnaireItemType.enums.display,
    modifierExtension: [
      questionnaireItemUiDisplayLevelExtension(
        QuestionnaireItemUiDisplayLevel.enums.heading1
      ),
    ],
  },
  {
    linkId: sluggify('part-1-title'),
    text: 'Part 1: Symptoms of attention-deficit (DSM-IV criterion A1)',
    type: QuestionnaireItemType.enums.display,
    modifierExtension: [
      questionnaireItemUiDisplayLevelExtension(
        QuestionnaireItemUiDisplayLevel.enums.heading2
      ),
    ],
  },
  {
    linkId: sluggify('part-1-instructions'),
    text:
      'Instructions: the symptoms in adulthood have to have been present for at least 6 months. ' +
      'The symptoms in childhood relate to the age of 5-12 years. ' +
      'For a symptom to be ascribed to ADHD it should have a chronic trait-like course and should not be episodic.',
    type: QuestionnaireItemType.enums.display,
    // style: QuestionnaireItemStyle.QUESTION,
  },
]

const part1DivaQuestions: DivaQuestion[] = [
  {
    prefix: 'A1',
    questionText:
      'Do you often fail to give close attention to detail, or do you make careless mistakes in your work or during other activities?',
    adultSymptoms: [
      'Makes careless mistakes',
      'Works slowly to avoid mistakes',
      'Does not read instructions carefully',
      'Difficulty working in a detailed way',
      'Too much time needed to complete detailed tasks',
      'Gets easily bogged down by details',
      'Works too quickly and therefore makes mistakes',
    ],
    childQuestionText: 'And how was that during childhood?',
    childSymptoms: [
      'Careless mistakes in schoolwork',
      'Mistakes made by not reading questions properly',
      'Leaves questions unanswered by not reading them properly',
      'Leaves the reverse side of a test unanswered',
      'Others comment about careless work',
      'Not checking the answers in homework',
      'Too much time needed to complete detailed tasks',
    ],
  },
  {
    prefix: 'A2',
    questionText:
      'Do you often find it difficult to sustain your attention on tasks?',
    adultSymptoms: [
      'Not able to keep attention on tasks for long (Unless the subject is found to be really interesting (e.g. computer or hobby))',
      'Quickly distracted by own thoughts or associations',
      'Finds it difficult to watch a film through to the end, or to read a book (Unless the subject is found to be really interesting (e.g. computer or hobby))',
      'Quickly becomes bored with things*',
      'Asks questions about subjects that have already been discussed',
    ],
    childQuestionText: 'And how was that during childhood?',
    childSymptoms: [
      'Difficulty keeping attention on schoolwork',
      'Difficulty keeping attention on play (Unless the subject is found to be really interesting (e.g. computer or hobby))',
      'Easily distracted',
      'Difficulty concentrating*',
      'Needing structure to avoid becoming distracted',
      'Quickly becoming bored of activities (Unless the subject is found to be really interesting (e.g. computer or hobby))',
    ],
  },
  {
    prefix: 'A3',
    questionText:
      'Does it often seem as though you are not listening when you are spoken to directly?',
    adultSymptoms: [
      'Dreamy or preoccupied',
      'Difficulty concentrating on a conversation',
      'Afterwards, not knowing what a conversation was about',
      'Often changing the subject of the conversation',
      'Others saying that your thoughts are somewhere else',
    ],
    childQuestionText: 'And how was that during childhood?',
    childSymptoms: [
      'Not knowing what parents/teachers have said',
      'Dreamy or preoccupied',
      'Only listening during eye contact or when a voice is raised',
      'Often having to be addressed again',
      'Questions having to be repeated',
    ],
  },
  {
    prefix: 'A4',
    questionText:
      'Do you often fail to follow through on instructions and do you often fail to finish jobs or fail to meet obligations at work? ',
    adultSymptoms: [
      'Does things that are muddled up together without completing them',
      'Difficulty completing tasks once the novelty has worn off',
      'Needing a time limit to complete tasks',
      'Difficulty completing administrative tasks',
      'Difficulty following instructions from a manual',
    ],
    childQuestionText:
      'And how was that during childhood (when doing schoolwork as opposed to when at work)?',
    childSymptoms: [
      'Difficulty following instructions',
      'Difficulty with instructions involving more than one step',
      'Not completing things',
      'Not completing homework or handing it in',
      'Needing a lot of structure in order to complete tasks',
    ],
  },
  {
    prefix: 'A5',
    questionText:
      'Do you often find it difficult to organise tasks and activities?',
    adultSymptoms: [
      'Difficulty with planning activities of daily life',
      'House and/or workplace are disorganised',
      'Planning too many tasks or non-efficient planning',
      'Regularly booking things to take place at the same time (double-booking)',
      'Arriving late',
      'Not able to use an agenda or diary consistently',
      'Inflexible because of the need to keep to schedules',
      'Poor sense of time',
      'Creating schedules but not using them',
      'Needing other people to structure things',
    ],
    childQuestionText: 'And how was that during childhood?',
    childSymptoms: [
      'Difficulty being ready on time',
      'Messy room or desk',
      'Difficulty playing alone',
      'Difficulty planning tasks or homework',
      'Doing things in a muddled way',
      'Arriving late',
      'Poor sense of time',
      'Difficulty keeping himself/herself entertained',
    ],
  },
  {
    prefix: 'A6',
    questionText:
      'Do you often avoid (or do you have an aversion to, or are you unwilling to do) tasks which require sustained mental effort?',
    adultSymptoms: [
      'Do the easiest or nicest things first of all',
      'Often postpone boring or difficult tasks',
      'Postpone tasks so that deadlines are missed',
      'Avoid monotonous work, such as administration',
      'Do not like reading due to mental effort',
      'Avoidance of tasks that require a lot of concentration ',
    ],
    childQuestionText: 'And how was that during childhood?',
    childSymptoms: [
      'Avoidance of homework or has an aversion to this',
      'Reads few books or does not feel like reading due to mental effort',
      'Avoidance of tasks that require a lot of concentration',
      'Aversion to school subjects that require a lot of concentration',
      'Often postpones boring or difficult tasks.',
    ],
  },
  {
    prefix: 'A7',
    questionText:
      'Do you often lose things that are needed for tasks or activities?',
    adultSymptoms: [
      'Mislays wallet, keys, or agenda',
      'Often leaves things behind',
      'Loses papers for work',
      'Loses a lot of time searching for things',
      'Gets in a panic if other people move things around',
      'Stores things away in the wrong place',
      'Loses notes, lists or telephone numbers',
    ],
    childQuestionText: 'And how was that during childhood?',
    childSymptoms: [
      'Loses diaries, pens, gym kit or other items',
      'Mislays toys, clothing, or homework',
      'Spends a lot of time searching for things',
      'Gets in a panic if other people move things around',
      'Comments from parents and/or teacher about things being lost',
    ],
  },
  {
    prefix: 'A8',
    questionText: 'Are you often easily distracted by external stimuli?',
    adultSymptoms: [
      'Difficulty shutting off from external stimuli',
      'After being distracted, difficult to pick up the thread again',
      'Easily distracted by noises or events',
      'Easily distracted by the conversations of others',
      'Difficulty in filtering and/or selecting information',
    ],
    childQuestionText: 'And how was that during childhood?',
    childSymptoms: [
      'In the classroom, often looking outside',
      'Easily distracted by noises or events',
      'After being distracted, has difficulty picking up the thread again',
    ],
  },
  {
    prefix: 'A9',
    questionText: 'Are you often forgetful during daily activities?',
    adultSymptoms: [
      'Forgets appointments or other obligations',
      'Forgets keys, agenda etc.',
      'Needs frequent reminders for appointments',
      'Returning home to fetch forgotten things',
      'Rigid use of lists to make sure things aren’t forgotten',
      'Forgets to keep or look at daily agenda',
    ],
    childQuestionText: 'And how was that during childhood?',
    childSymptoms: [
      'Forgets appointments or instructions',
      'Has to be frequently reminded of things',
      'Half-way through a task, forgetting what has to be done',
      'Forgets to take things to school',
      'Leaving things behind at school or at friends’ houses',
    ],
  },
]

const part1Criteria: QuestionnaireItem[] = [
  {
    linkId: sluggify('part-1-criterion-a-title'),
    text: 'Supplement criterion A',
    type: QuestionnaireItemType.enums.display,
    modifierExtension: [
      questionnaireItemUiDisplayLevelExtension(
        QuestionnaireItemUiDisplayLevel.enums.heading2
      ),
    ],
  },
  {
    linkId: sluggify('part-1-criterion-a-adulthood-subtitle'),
    text: 'Adulthood:',
    type: QuestionnaireItemType.enums.display,
    modifierExtension: [
      questionnaireItemUiDisplayLevelExtension(
        QuestionnaireItemUiDisplayLevel.enums.heading3
      ),
    ],
  },
  {
    linkId: sluggify('part-1-criterion-a-adulthood'),
    text: 'Do you have more of these symptoms of attention deficit than other people, or do you experience these more frequently than other people of your age?',
    // style: QuestionnaireItemStyle.QUESTION,
    type: QuestionnaireItemType.enums.boolean,
  },
  {
    linkId: sluggify('part-1-criterion-a-childhood-subtitle'),
    text: 'Childhood:',
    type: QuestionnaireItemType.enums.display,
    modifierExtension: [
      questionnaireItemUiDisplayLevelExtension(
        QuestionnaireItemUiDisplayLevel.enums.heading3
      ),
    ],
  },
  {
    linkId: sluggify('part-1-criterion-a-childhood'),
    text: 'Did you have more of these symptoms of attention deficit than other children of your age, or did you experience these more frequently than other children of your age? ',
    // style: QuestionnaireItemStyle.QUESTION,
    type: QuestionnaireItemType.enums.boolean,
  },
  {
    text: 'Part 2: Symptoms of hyperactivity-impulsivity  (DSM-IV criterion A2)',
    linkId: sluggify('part-2-title'),
    type: QuestionnaireItemType.enums.display,
    modifierExtension: [
      questionnaireItemUiDisplayLevelExtension(
        QuestionnaireItemUiDisplayLevel.enums.heading2
      ),
    ],
  },
]

const part2Preamble: QuestionnaireItem[] = [
  {
    linkId: sluggify('part-2-instructions'),
    text:
      'Instructions: the symptoms in adulthood have to have been present for at least 6 months. ' +
      'The symptoms in childhood relate to the age of 5-12 years. ' +
      'For a symptom to be ascribed to ADHD it should have a chronic trait-like course and should not be episodic.',
    type: QuestionnaireItemType.enums.display,
    // style: QuestionnaireItemStyle.QUESTION,
  },
]

const part2DivaQuestions: DivaQuestion[] = [
  {
    prefix: 'H/I 1',
    questionText:
      'Do you often move your hands or feet in a restless manner, or do you often fidget in your chair?',
    adultSymptoms: [
      'Difficulty sitting still',
      'Fidgets with the legs',
      'Tapping with a pen or playing with something',
      'Fiddling with hair or biting nails',
      'Able to control restlessness, but feels stressed as a result',
    ],
    childQuestionText: 'And how was that during childhood?',
    childSymptoms: [
      'Parents often said “sit still” or similar',
      'Fidgets with the legs',
      'Tapping with a pen or playing with something',
      'Fiddling with hair or biting nails',
      'Unable to remain seated in a chair in a relaxed manner',
      'Able to control restlessness, but feels stressed as a result',
    ],
  },
  {
    prefix: 'H/I 2',
    questionText:
      'Do you often stand up in situations where the expectation is that you should remain in your seat?',
    adultSymptoms: [
      'Avoids symposiums, lectures, church etc.',
      'Prefers to walk around rather than sit',
      'Never sits still for long, always moving around',
      'Stressed owing to the difficulty of sitting still',
      'Makes excuses in order to be able to walk around',
    ],
    childQuestionText: 'And how was that during childhood?',
    childSymptoms: [
      'Often stands up while eating or in the classroom',
      'Finds it very difficult to stay seated at school or during meals',
      'Being told to remain seated',
      'Making excuses in order to walk around ',
    ],
  },
  {
    prefix: 'H/I 3',
    questionText: 'Do you often feel restless?',
    adultSymptoms: [
      'Feeling restless or agitated inside',
      'Constantly having the feeling that you have to be doing something',
      'Finding it hard to relax',
    ],
    childQuestionText: 'And how was that during childhood?',
    childSymptoms: [
      'Always running around',
      'Climbing on furniture, or jumping on the sofa',
      'Climbing in trees',
      'Feeling restless inside',
    ],
  },
  {
    prefix: 'H/I 4',
    questionText:
      'Do you often find it difficult to engage in leisure activities quietly?',
    adultSymptoms: [
      'Talks during activities when this is not appropriate',
      'Becoming quickly too cocky in public',
      'Being loud in all kinds of situations',
      'Difficulty doing activities quietly',
      'Difficulty in speaking softly',
    ],
    childQuestionText: 'And how was that during childhood?',
    childSymptoms: [
      'Being loud-spoken during play or in the classroom',
      'Unable to watch TV or films quietly',
      'Asked to be quieter or calm down',
      'Becoming quickly too cocky in public ',
    ],
  },
  {
    prefix: 'H/I 5',
    questionText:
      'Are you often on the go or do you often act as if “driven by a motor”?',
    adultSymptoms: [
      'Always busy doing something',
      'Has too much energy, always on the move',
      'Stepping over own boundaries',
      'Finds it difficult to let things go, excessively driven',
    ],
    childQuestionText: 'And how was that during childhood?',
    childSymptoms: [
      'Constantly busy',
      'Excessively active at school and at home',
      'Has lots of energy',
      'Always on the go, excessively driven',
    ],
  },
  {
    prefix: 'H/I 6',
    questionText: 'Do you often talk excessively?',
    adultSymptoms: [
      'So busy talking that other people find it tiring',
      'Known to be an incessant talker',
      'Finds it difficult to stop talking',
      'Tendency to talk too much',
      'Not giving others room to interject during a conversation',
      'Needing a lot of words to say something',
    ],
    childQuestionText: 'And how was that during childhood?',
    childSymptoms: [
      'Known as a chatterbox',
      'Teachers and parents often ask you to be quiet',
      'Comments in school reports about talking too much',
      'Being punished for talking too much',
      'Keeping others from doing schoolwork by talking too much',
      'Not giving others room during a conversation',
    ],
  },
  {
    prefix: 'H/I 7',
    questionText:
      'Do you often give the answer before questions have been completed?',
    adultSymptoms: [
      'Being a blabbermouth, saying what you think',
      'Saying things without thinking first',
      'Giving people answers before they have finished speaking',
      'Completing other people’s words',
      'Being tactless',
    ],
    childQuestionText: 'And how was that during childhood?',
    childSymptoms: [
      'Being a blabbermouth, saying things without thinking first',
      'Wants to be the first to answer questions at school',
      'Blurts out an answer even if it is wrong',
      'Interrupts others before sentences are finished',
      'Coming across as being tactless',
    ],
  },
  {
    prefix: 'H/I 8',
    questionText: 'Do you often find it difficult to await your turn?',
    adultSymptoms: [
      'Difficulty waiting in a queue, jumping the queue',
      'Difficulty in patiently waiting in the traffic/traffic jams',
      'Difficulty waiting your turn during conversations',
      'Being impatient',
      'Quickly starting relationships/jobs, or ending/leaving these because of impatience',
    ],
    childQuestionText: 'And how was that during childhood?',
    childSymptoms: [
      'Difficulty waiting turn in group activities',
      'Difficulty waiting turn in the classroom',
      'Always being the first to talk or act',
      'Becomes quickly impatient',
      'Crosses the road without looking',
    ],
  },
  {
    prefix: 'H/I 9',
    questionText:
      'Do you often interrupt the activities of others, or intrude on others?',
    adultSymptoms: [
      'Being quick to interfere with others',
      'Interrupts others',
      'Disturbes other people’s activities without being asked',
      'Comments from others about interference',
      'Difficulty respecting the boundaries of others',
      'Having an opinion about everything and immediately expressing this',
    ],
    childQuestionText: 'And how was that during childhood?',
    childSymptoms: [
      'Impinges on the games of others',
      'Interrupts the conversations of others',
      'Reacts to everything',
      'Unable to wait',
    ],
  },
]

const part2Criteria: QuestionnaireItem[] = [
  {
    linkId: sluggify('part-2-criterion-a-title'),
    text: 'Supplement criterion A',
    type: QuestionnaireItemType.enums.display,
    modifierExtension: [
      questionnaireItemUiDisplayLevelExtension(
        QuestionnaireItemUiDisplayLevel.enums.heading2
      ),
    ],
  },
  {
    text: 'Adulthood:',
    linkId: sluggify('part-2-criterion-a-adulthood-subtitle'),
    type: QuestionnaireItemType.enums.display,
    modifierExtension: [
      questionnaireItemUiDisplayLevelExtension(
        QuestionnaireItemUiDisplayLevel.enums.heading3
      ),
    ],
  },
  {
    linkId: sluggify('part-2-criterion-a-adulthood'),
    text: 'Do you have more of these symptoms of hyperactivity/impulsivity than other people, or do you experience these more frequently than other people?',
    // style: QuestionnaireItemStyle.QUESTION,
    type: QuestionnaireItemType.enums.boolean,
  },
  {
    linkId: sluggify('part-2-criterion-a-childhood-subtitle'),
    text: 'Childhood:',
    type: QuestionnaireItemType.enums.display,
    modifierExtension: [
      questionnaireItemUiDisplayLevelExtension(
        QuestionnaireItemUiDisplayLevel.enums.heading3
      ),
    ],
  },
  {
    linkId: sluggify('part-2-criterion-a-childhood'),
    text: 'Did you have more of these symptoms of hyperactivity/impulsivity than other children of your age, or did you experience these more frequently than other children of your age?',
    // style: QuestionnaireItemStyle.QUESTION,
    type: QuestionnaireItemType.enums.boolean,
  },
]

const part3Preamble: QuestionnaireItem[] = [
  {
    text: 'Part 3: Impairment on account of the symptoms (DSM-IV criteria B, C and D)',
    linkId: sluggify('part-3-title'),
    type: QuestionnaireItemType.enums.display,
    modifierExtension: [
      questionnaireItemUiDisplayLevelExtension(
        QuestionnaireItemUiDisplayLevel.enums.heading2
      ),
    ],
  },
  {
    linkId: sluggify('part-3-criterion-b-title'),
    text: 'Supplement criterion B',
    type: QuestionnaireItemType.enums.display,
    modifierExtension: [
      questionnaireItemUiDisplayLevelExtension(
        QuestionnaireItemUiDisplayLevel.enums.heading2
      ),
    ],
  },
  {
    text: 'Have you always had these symptoms of attention deficit and/or hyperactivity/impulsivity? (a number of symptoms were present prior to the 7th year of age)',
    linkId: sluggify('part-3-criterion-b'),
    // style: QuestionnaireItemStyle.QUESTION,
    type: QuestionnaireItemType.enums.boolean,
  },
  {
    linkId: sluggify('part-3-criterion-b-onset-age'),
    text: 'If no is answered above, starting as from ____ year of age.',
    // style: QuestionnaireItemStyle.WITHIN_QUESTION,
    type: QuestionnaireItemType.enums.text,
  },
  {
    linkId: sluggify('part-3-criterion-c-title'),
    text: 'Supplement criterion C',
    type: QuestionnaireItemType.enums.display,
    modifierExtension: [
      questionnaireItemUiDisplayLevelExtension(
        QuestionnaireItemUiDisplayLevel.enums.heading2
      ),
    ],
  },
  {
    linkId: sluggify('part-3-criterion-c-instructions'),
    text: 'In which areas do you have / have you had problems with these symptoms?',
    type: QuestionnaireItemType.enums.display,
    modifierExtension: [
      questionnaireItemUiDisplayLevelExtension(
        QuestionnaireItemUiDisplayLevel.enums.heading3
      ),
    ],
  },
]

const part3DivaQuestions: DivaQuestion[] = [
  {
    prefix: 'S 1',
    questionText: 'Adulthood symptoms: Work/education',
    adultSymptoms: [
      'Did not complete education/training needed for work',
      'Work below level of education',
      'Tire quickly of a workplace',
      'Pattern of many short-lasting jobs',
      'Difficulty with administrative work/planning',
      'Not achieving promotions',
      'Under-performing at work',
      'Left work following arguments or dismissal',
      'Sickness benefits/disability benefit as a result of symptoms',
      'Limited impairment through compensation of high IQ',
      'Limited impairment through compensation of external structure',
    ],
    childQuestionText: 'Childhood symptoms: Education',
    childSymptoms: [
      'Lower educational level than expected based on IQ',
      'Staying back (repeating classes) as a result of concentration problems',
      'Education not completed / rejected from school',
      'Took much longer to complete education than usual',
      'Achieved education suited to IQ with a lot of effort',
      'Difficulty doing homework',
      'Followed special education on account of symptoms',
      'Comments from teachers about behaviour or concentration',
      'Limited impairment through compensation of high IQ',
      'Limited impairment through compensation of external structure',
    ],
  },
  {
    prefix: 'S 2',
    questionText: 'Adulthood symptoms: Relationship and/or family',
    adultSymptoms: [
      'Tire quickly of relationships',
      'Impulsively commencing/ending relationships',
      'Unequal partner relationship owing to symptoms',
      'Relationship problems, lots of arguments, lack of intimacy',
      'Divorced owing to symptoms',
      'Problems with sexuality as a result of symptoms',
      'Problems with upbringing as a result of symptoms',
      'Difficulty with housekeeping and/or administration',
      'Financial problems or gambling',
      'Not daring to start a relationship',
    ],
    childQuestionText: 'Childhood symptoms: Family',
    childSymptoms: [
      'Frequent arguments with brothers or sisters',
      'Frequent punishment or hiding',
      'Little contact with family on account of conflicts',
      'Required structure from parents for a longer period than would normally be the case',
    ],
  },
  {
    prefix: 'S 3',
    questionText: 'Adulthood symptoms: Social contacts',
    adultSymptoms: [
      'Tire quickly of social contacts',
      'Difficulty maintaining social contacts',
      'Conflicts as a result of communication problems',
      'Difficulty initiating social contacts',
      'Low self-assertiveness as a result of negative experiences',
      'Not being attentive (i.e. forget to send a card/ empathising/phoning, etc)',
    ],
    childQuestionText: 'Childhood symptoms: Social contacts',
    childSymptoms: [
      'Difficulty maintaining social contacts',
      'Conflicts as a result of communication problems',
      'Difficulty entering into social contacts',
      'Low self-assertiveness as a result of negative experiences',
      'Few friends',
      'Being teased',
      'Shut out by, or not being allowed, to do things with a group',
      'Being a bully',
    ],
  },
  {
    prefix: 'S 4',
    questionText: 'Adulthood symptoms: Free time / hobby',
    adultSymptoms: [
      'Unable to relax properly during free time',
      'Having to play lots of sports in order to relax',
      'Injuries as a result of excessive sport',
      'Unable to finish a book or watch a film all the way through',
      'Being continually busy and therefore becoming overtired',
      'Tire quickly of hobbies',
      'Accidents/loss of driving licence as a result of reckless driving behaviour',
      'Sensation seeking and/or taking too many risks',
      'Contact with the police/the courts',
      'Binge eating',
    ],
    childQuestionText: 'Childhood symptoms: Free time / hobby',
    childSymptoms: [
      'Unable to relax properly during free time',
      'Having to play lots of sport to be able to relax',
      'Injuries as a result of excessive sport',
      'Unable to finish a book or watch a film all the way through',
      'Being continually busy and therefore becoming overtired',
      'Tired quickly of hobbies',
      'Sensation seeking and/or taking too many risks',
      'Contact with the police/courts',
      ' Increased number of accidents',
    ],
  },
  {
    prefix: 'S 5',
    questionText: 'Adulthood symptoms: Self-confidence / self-image',
    adultSymptoms: [
      'Uncertainty through negative comments of others',
      'Negative self-image due to experiences of failure',
      'Fear of failure in terms of starting new things',
      'Excessive intense reaction to criticism',
      'Perfectionism',
      'Distressed by the symptoms of ADHD',
    ],
    childQuestionText: 'Childhood symptoms: Self-confidence / self-image',
    childSymptoms: [
      'Uncertainty through negative comments of others',
      'Negative self-image due to experiences of failure',
      'Fear of failure in terms of starting new things',
      'Excessive intense reaction to criticism',
      'Perfectionism',
    ],
  },
]

const conclusionItems: QuestionnaireItem[] = [
  {
    linkId: sluggify('adulthood-evidence-of-impairment'),
    text: 'Adulthood: Evidence of impairment in two or more areas? ',
    type: QuestionnaireItemType.enums.boolean,
    // style: QuestionnaireItemStyle.QUESTION,
  },
  {
    linkId: sluggify('childhood-evidence-of-impairment'),
    text: 'Childhood and adolescence: Evidence of impairment in two or more areas?',
    type: QuestionnaireItemType.enums.boolean,
    // style: QuestionnaireItemStyle.QUESTION,
  },
  {
    linkId: sluggify('end-of-interview-title'),
    text: 'End of the interview. Please continue with the summary',
    type: QuestionnaireItemType.enums.display,
    modifierExtension: [
      questionnaireItemUiDisplayLevelExtension(
        QuestionnaireItemUiDisplayLevel.enums.heading3
      ),
    ],
  },
  {
    linkId: sluggify('summary'),
    text: 'Potential details:',
    type: QuestionnaireItemType.enums.text,
    // style: QuestionnaireItemStyle.QUESTION,
  },
]

const toItems = ({
  prefix,
  questionText,
  adultSymptoms,
  childQuestionText,
  childSymptoms,
}: DivaQuestion): QuestionnaireItem[] => {
  const adultExampleQuestionnaireItemLabel = sluggify(
    prefix + '-adult-examples'
  )
  const childhoodExampleQuestionnaireItemLabel = sluggify(
    prefix + '-childhood-examples'
  )
  return [
    {
      linkId: sluggify(prefix + '-title'),
      text: questionText,
      modifierExtension: [
        questionnaireItemUiDisplayLevelExtension(
          QuestionnaireItemUiDisplayLevel.enums.heading3
        ),
      ],
      type: QuestionnaireItemType.enums.display,
    },
    {
      text: 'Examples during adulthood:',
      linkId: adultExampleQuestionnaireItemLabel,
      // style: QuestionnaireItemStyle.QUESTION,
      type: QuestionnaireItemType.enums.group,
      modifierExtension: [
        questionnaireItemUiControlCodeExtension(
          QuestionnaireItemUIControlCode.enums.table
        ),
      ],
      item: adultSymptoms.map(
        (text): QuestionnaireItem => ({
          linkId: sluggify(prefix + '-adult-example-' + text),
          text,
          // style: QuestionnaireItemStyle.WITHIN_QUESTION,
          type: QuestionnaireItemType.enums.boolean,
        })
      ),
    },
    {
      linkId: sluggify(prefix + '-other-adult-example'),
      text: 'Other examples during adulthood:',
      // style: QuestionnaireItemStyle.WITHIN_QUESTION,
      type: QuestionnaireItemType.enums.text,
    },
    {
      linkId: sluggify(prefix + '-adult-symptom-present'),
      text: 'Adult symptom present?',
      // style: QuestionnaireItemStyle.QUESTION,
      type: QuestionnaireItemType.enums.boolean,
    },
    {
      linkId: sluggify(prefix + '-child-title'),
      text: childQuestionText,
      modifierExtension: [
        questionnaireItemUiDisplayLevelExtension(
          QuestionnaireItemUiDisplayLevel.enums.heading3
        ),
      ],
      type: QuestionnaireItemType.enums.display,
    },
    {
      linkId: childhoodExampleQuestionnaireItemLabel,
      text: 'Examples during childhood:',
      modifierExtension: [
        questionnaireItemUiControlCodeExtension(
          QuestionnaireItemUIControlCode.enums.table
        ),
      ],
      type: QuestionnaireItemType.enums.group,
      item: childSymptoms.map((text) => ({
        linkId: sluggify(prefix + '-child-example-' + text),
        text,
        // style: QuestionnaireItemStyle.WITHIN_QUESTION,
        type: QuestionnaireItemType.enums.boolean,
      })),
    },
    {
      linkId: sluggify(prefix + '-other-childhood-example'),
      text: 'Other examples during childhood:',
      // style: QuestionnaireItemStyle.WITHIN_QUESTION,
      type: QuestionnaireItemType.enums.text,
    },
    {
      linkId: sluggify(prefix + '-childhood-symptom-present'),
      text: 'Childhood symptom present?',
      // style: QuestionnaireItemStyle.QUESTION,
      type: QuestionnaireItemType.enums.boolean,
    },
  ]
}

export const divaQuestionnaireItems: QuestionnaireItem[] = [
  ...part1Preamble,
  ...part1DivaQuestions.flatMap(toItems),
  ...part1Criteria,
  ...part2Preamble,
  ...part2DivaQuestions.flatMap(toItems),
  ...part2Criteria,
  ...part3Preamble,
  ...part3DivaQuestions.flatMap(toItems),
  ...conclusionItems,
]

export default divaQuestionnaireItems
