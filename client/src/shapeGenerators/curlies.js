import * as d3 from 'd3'

export function startLoopPath(
  startPoint,
  endPoint,
  initialRadius,
  secondRadius,
  knobRadius,
  narrowestLineWidth,
  lineVariance,
  overcurl
) {
  const startingLineLength = 40;
  const loopRadiusDifference =
    secondRadius / 2 >= initialRadius
      ? -(secondRadius - initialRadius * 2)
      : initialRadius * 2 - secondRadius;
  const startingLineEndpoint = startPoint[0] - startingLineLength;

  const llcx =
    startingLineEndpoint - initialRadius - lineVariance * narrowestLineWidth;
  const llcy = startPoint[1] + initialRadius;
  const llStartAngle = 1.5 * Math.PI;
  const llEndAngle = 0.5 * Math.PI;

  const blcx = startingLineEndpoint - initialRadius;
  const blcy = startPoint[1] + loopRadiusDifference;
  const blStartAngle = 0.5 * Math.PI;
  const blEndAngle = 1.5 * Math.PI;

  const knobcx = blcx;
  const knobcy = blcy - secondRadius + knobRadius;
  const kStartAngle = blEndAngle;
  const kEndAngle = blEndAngle + 0.5 * Math.PI;

  // big return arc/loop
  const brcx = startingLineEndpoint - initialRadius;
  const brcy =
    startPoint[1] + loopRadiusDifference - narrowestLineWidth / 2 / 2;
  const brStartAngle = 1.6 * Math.PI;
  const brEndAngle = 0.5 * Math.PI;
  const brlRadius = secondRadius - narrowestLineWidth;

  // little return arc/loop
  const lrcx = startingLineEndpoint - initialRadius;
  const lrcy = startPoint[1] + initialRadius;
  const lrStartAngle = 0.5 * Math.PI;
  const lrEndAngle = 1.5 * Math.PI;
  const lrlRadius =
    initialRadius - narrowestLineWidth - narrowestLineWidth / 2 / 2;

  const path = d3.path();
  path.moveTo(startPoint[0], startPoint[1]);
  path.lineTo(startPoint[0] - startingLineLength, startPoint[1]);

  // little initial downward loop
  path.arc(llcx, llcy, initialRadius, llStartAngle, llEndAngle, true);

  // big upward Loop
  path.arc(blcx, blcy, secondRadius, blStartAngle, blEndAngle, true);

  // little knob or scrollDot
  path.arc(knobcx, knobcy, knobRadius, kStartAngle, kEndAngle, true);

  // little knob or scrollDot
  path.arc(brcx, brcy, brlRadius, brStartAngle, brEndAngle, false);

  // little knob or scrollDot
  path.arc(lrcx, lrcy, lrlRadius, lrStartAngle, lrEndAngle, false);

  // final line closure
  path.lineTo(endPoint[0], endPoint[1]);

  return path;
}

export function endLoopPath(
  startPoint,
  endPoint,
  initialRadius,
  tailHeight,
  tailSwoopiness, // 0.0-1.0
  knobRadius,
  narrowestLineWidth,
  lineVariance,
  swoopStrokeBulge
) {
  const startingLineOffset = 40;
  const tau = Math.PI * 2;
  const bottomScrollArcRadius =
    initialRadius * 2 + tailSwoopiness * (initialRadius * 4);
  const swoopStrokeHeight = tailHeight - bottomScrollArcRadius;
  // The taller the bounding box for the bezier curve, the
  // more subtle the
  const swoopCoefficient = bottomScrollArcRadius / swoopStrokeHeight - 0.1;

  const llcx = startPoint[0] + startingLineOffset;
  const llcy = startPoint[1] - initialRadius;
  const llStartAngle = 0.25 * tau;
  const llEndAngle = -0.5 * tau;

  const firstLoopEndPoint = [llcx - initialRadius, llcy];

  // downward swoop stroke
  const sscp1x = firstLoopEndPoint[0];
  const sscp1y = firstLoopEndPoint[1] + swoopCoefficient * swoopStrokeHeight;
  const ssEndPointX = firstLoopEndPoint[0] + bottomScrollArcRadius;
  const ssEndPointY = firstLoopEndPoint[1] + swoopStrokeHeight;
  const sscp2x = ssEndPointX;
  const sscp2y = ssEndPointY - swoopCoefficient * 1.2 * swoopStrokeHeight;

  // scrollArc
  const sacx = ssEndPointX - bottomScrollArcRadius;
  const sacy = ssEndPointY;
  const saStartAngle = 0 * tau;
  const saEndAngle = 0.25 * tau;

  const knobcx = sacx;
  const knobcy = sacy + bottomScrollArcRadius - knobRadius;
  const kStartAngle = saEndAngle;
  const kEndAngle = kStartAngle + 0.75 * tau;

  // return scrollArc
  const rsaRadius = bottomScrollArcRadius - narrowestLineWidth * lineVariance;
  const rsacx = sacx;
  const rsacy = knobcy + narrowestLineWidth / 2 - rsaRadius;
  const rsaStartAngle = 0.25 * tau;
  const rsaEndAngle = 1 * tau;

  const rsaEndPointX = rsacx + rsaRadius;
  const rsaEndPointY = rsacy;

  // return upswoop bezier curve
  const downstrokeControlVectorMagnitude = sscp1y - firstLoopEndPoint[1];
  const uscp1x = rsaEndPointX;
  const uscp1y = sscp2y;
  const usEndPointX = firstLoopEndPoint[0] - narrowestLineWidth;
  const usEndPointY = firstLoopEndPoint[1];
  const uscp2x = usEndPointX;
  const uscp2y = sscp1y + swoopStrokeBulge * narrowestLineWidth * lineVariance;

  // returning quarter-arc for initial loop
  const rqaRadius = initialRadius + narrowestLineWidth;
  const rqacx = llcx;
  const rqacy = llcy;
  const rqaStartAngle = 0.5 * tau;
  const rqaEndAngle = 0.75 * tau;

  // returning quarter-arc for initial loop
  const rhaRadius = rqaRadius;
  const rhacx = llcx;
  const rhacy = llcy;
  const rhaStartAngle = 0.75 * tau;
  const rhaEndAngle = 0.25 * tau;

  const path = d3.path();

  // Initial padding off of main waveform
  path.moveTo(startPoint[0], startPoint[1]);
  path.lineTo(startPoint[0] + startingLineOffset, startPoint[1]);

  // little initial upward loop segment
  path.arc(llcx, llcy, initialRadius, llStartAngle, llEndAngle, true);

  // downward bezier swoop
  path.bezierCurveTo(sscp1x, sscp1y, sscp2x, sscp2y, ssEndPointX, ssEndPointY);

  // bottom scroll arc to complete swoop
  path.arc(sacx, sacy, bottomScrollArcRadius, saStartAngle, saEndAngle, false);

  // little knob or scrollDot
  path.arc(knobcx, knobcy, knobRadius, kStartAngle, kEndAngle, false);

  // backtracking knob kneebend
  path.arcTo(
    knobcx + knobRadius,
    knobcy + knobRadius / 2,
    knobcx + knobRadius + 2,
    knobcy + knobRadius / 2,
    narrowestLineWidth / 2
  );

  // returning bottom arc
  path.arc(rsacx, rsacy, rsaRadius, rsaStartAngle, rsaEndAngle, true);

  // bezier for upward (returning) swoop stroke
  path.bezierCurveTo(uscp1x, uscp1y, uscp2x, uscp2y, usEndPointX, usEndPointY);

  // returning quarter arc for initial loop
  path.arc(rqacx, rqacy, rqaRadius, rqaStartAngle, rqaEndAngle, false);

  // returning half arc for initial loop
  path.arc(rhacx, rhacy, rhaRadius, rhaStartAngle, rhaEndAngle, false);

  // line connector to complete curve
  path.lineTo(endPoint[0], endPoint[1]);

  return path;
}