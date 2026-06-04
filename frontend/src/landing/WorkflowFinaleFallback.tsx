import '../styles/workflow-finale-fallback.css';

export default function WorkflowFinaleFallback() {
  return (
    <div className="workflow-finale-fallback" aria-hidden>
      <span className="workflow-finale-fallback__ring workflow-finale-fallback__ring--outer" />
      <span className="workflow-finale-fallback__ring workflow-finale-fallback__ring--inner" />
      <span className="workflow-finale-fallback__core" />
      <ul className="workflow-finale-fallback__steps">
        {['Upload', 'Extract', 'Estimate', 'Deliver'].map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ul>
    </div>
  );
}
