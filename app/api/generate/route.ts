import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyCmcrAhT9oCOXugfhJW_PZAsAWknIV3NNg';

export async function POST(req: NextRequest) {
  try {
    const { prompt, model, previousMessages } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(API_KEY);

    // Determine if this is an edit request based on context
    const isEditRequest = previousMessages && previousMessages.length > 0 &&
      (prompt.toLowerCase().includes('change') ||
       prompt.toLowerCase().includes('modify') ||
       prompt.toLowerCase().includes('edit') ||
       prompt.toLowerCase().includes('make it') ||
       prompt.toLowerCase().includes('add') ||
       prompt.toLowerCase().includes('remove'));

    let finalPrompt = prompt;

    // If it's an edit request, enhance the prompt with context
    if (isEditRequest && previousMessages.length > 0) {
      const lastImageMessage = [...previousMessages].reverse().find((m: any) => m.image);
      if (lastImageMessage) {
        finalPrompt = `Based on the previous image generation, now: ${prompt}`;
      }
    }

    // Use the appropriate model based on selection
    const modelName = model === '2.5' ? 'imagen-3.0-generate-001' : 'imagen-3.0-generate-001';
    const imageModel = genAI.getGenerativeModel({ model: modelName });

    // Generate the image
    const result = await imageModel.generateContent([finalPrompt]);
    const response = await result.response;

    // Extract image data
    let imageData = null;
    const candidates = response.candidates;

    if (candidates && candidates.length > 0) {
      const candidate = candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    }

    // If no image data found, try text generation as fallback
    if (!imageData) {
      const textModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const textResult = await textModel.generateContent([
        `Generate a detailed image generation prompt for: ${finalPrompt}`
      ]);
      const textResponse = await textResult.response;
      const text = textResponse.text();

      // Try image generation again with enhanced prompt
      const retryResult = await imageModel.generateContent([text]);
      const retryResponse = await retryResult.response;
      const retryCandidates = retryResponse.candidates;

      if (retryCandidates && retryCandidates.length > 0) {
        const retryCandidate = retryCandidates[0];
        if (retryCandidate.content && retryCandidate.content.parts) {
          for (const part of retryCandidate.content.parts) {
            if (part.inlineData) {
              imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              break;
            }
          }
        }
      }
    }

    if (imageData) {
      return NextResponse.json({
        image: imageData,
        text: isEditRequest ? 'Image modified successfully!' : 'Image generated successfully!',
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to generate image. Please try a different prompt.' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while generating the image' },
      { status: 500 }
    );
  }
}
